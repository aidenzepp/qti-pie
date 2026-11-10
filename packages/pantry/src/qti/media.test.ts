/**
 * Package-media mode's laws (`#pantry/qti/media.ts`), with no database: each law a policy states is
 * a check, read as the tests' host judge reads it (`#pantry/test/host-judge.ts` `judgedOf`) and
 * evaluated as PostgreSQL evaluates the CHECK it compiles to, over rows drawn for it, against the
 * reading its law states, written here apart from its pattern:
 *
 * - **Media path** against the URL Standard's reading of a scheme and a first slash, written here
 *   from the URL Standard, and every value it admits against the URL Standard's own parser (Node's
 *   `URL`), which must resolve it against its document; against the reference census, read from the
 *   grammar, for the fields it resolves; and against each reference's resolution;
 * - **Media type** against Node's `path.posix.extname` of a path's last segment and the policy's
 *   record, matched as written;
 * - **Media data** against the URL Standard's scheme, Node's `URL`'s protocol;
 * - **Media style** against the texts it names, in any case, and the backslash;
 * - **Media foreign** against the three foreign kinds and the three open classes it names, over every
 *   kind and every attribute name.
 *
 * Beside them, a package as an install publishes one, its manifest, its test's item refs and its
 * items naming `.xml` documents and its items fetching `.svg` pictures, judged by every law of the
 * policy over the rows its import writes: accepted under the nine-type roster, and refused under
 * Media type alone once an item fetches a `.css` stylesheet, so the laws read the fetched fields of
 * `#pantry/vocab/fetched.ts` and no other reference. Then the declaration's rows against the
 * grammar, the laws' names against the law table, so a refused import names its law and rule and
 * never dies unowned, and the schema built for no policy against the schema this package installs.
 */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import type { Law, Statement } from "@bjornpagen/grizzle";
import { Array as Arr, Duration, Effect, Formatter, Option, Predicate } from "effect";
import type { MediaPolicy } from "#pantry/db/install.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { textReferenceKinds } from "#pantry/grammar/references.ts";
import { readProgram } from "#pantry/import/program.ts";
import { checkNameOf, lawNames, refusalOf } from "#pantry/import/refusal.ts";
import { Qti } from "#pantry/qti/own.ts";
import { governorsOf, mediaLawsByName } from "#pantry/qti/media.ts";
import { qtiLevelsOf, qtiSchema } from "#pantry/qti/schema.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge, judgedLaws, judgedOf } from "#pantry/test/host-judge.ts";
import type { HostRows } from "#pantry/test/host-judge.ts";
import { refusedOf } from "#pantry/test/law-names.ts";
import { policyLaws } from "#pantry/test/oracle-laws.ts";
import type { Datum } from "#pantry/test/predicates.ts";
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
 * The roster of the install the policy was written for: nine media types, one lowercase spelling
 * of each.
 */
const nineTypes: MediaPolicy = {
  media: {
    gif: "image/gif",
    jpg: "image/jpeg",
    m4a: "audio/mp4",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    png: "image/png",
    svg: "image/svg+xml",
    webm: "video/webm",
    webp: "image/webp",
  },
};

/**
 * The policies every case is judged under: the install's own roster, and one of a single
 * extension, so a check that reads the roster wrongly is seen.
 */
const policies = [
  nineTypes,
  { media: { css: "text/css" } },
] as const satisfies readonly MediaPolicy[];

/**
 * The policy a case that needs only one is judged under: the install's own.
 */
const [ownPolicy] = policies;

/**
 * The laws a policy states, each by its name.
 */
type MediaLawName = keyof typeof policyLaws;

/**
 * A check's verdict over a row: true where it holds, false where it refuses, as a CHECK refuses a
 * row its predicate leaves false or unknown.
 */
type Verdict = (row: Readonly<Record<string, Datum>>) => boolean;

/**
 * Each check read so far, by its policy, its law and its relation.
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
const checkOf = (policy: MediaPolicy, law: MediaLawName, relation: string): Verdict => {
  const key = `${JSON.stringify(policy)} ${law} ${relation}`;
  const known = readChecks.get(key);
  if (known !== undefined) {
    return known;
  }

  const statements = mediaLawsByName(Option.some(policy))[law] ?? [];
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
 * The address a player resolves a relative one against, and the same document one directory
 * deeper: a path relative to its document resolves to another URL against each, and an address
 * that is none (a scheme's, a network path's, an absolute path's) to the same one. Each is deep
 * enough that no drawn value climbs to the root.
 */
const bases = [
  "https://player.example.test/1/2/3/4/5/6/7/8/item.xml",
  "https://player.example.test/1/2/3/4/5/6/7/8/9/item.xml",
] as const;

/**
 * Whether an address, as the URL Standard's parser reads it against the player's document, is a
 * path relative to that document: it parses against both {@link bases}, on their origin, to two
 * URLs.
 *
 * @param address - The address as written.
 * @returns Whether it resolves relative to its document.
 */
const resolvesRelative = (address: string): boolean =>
  bases.every((base) => URL.canParse(address, base)) &&
  new URL(address, bases[0]).origin === new URL(bases[0]).origin &&
  new URL(address, bases[0]).href !== new URL(address, bases[1]).href;

/**
 * Whether an address uses the `data:` scheme, as the URL Standard's parser reads its scheme.
 *
 * @param address - The address as written.
 * @returns Whether it parses with the scheme `data`.
 */
const isData = (address: string): boolean =>
  URL.canParse(address, bases[0]) && new URL(address, bases[0]).protocol === "data:";

/**
 * Read an address as the URL Standard's basic URL parser does before its states: its leading C0
 * controls and spaces stripped, then every ASCII tab and newline removed.
 *
 * @param address - The address as written.
 * @returns What the parser's states read.
 * @see {@link https://url.spec.whatwg.org/#concept-basic-url-parser | URL Standard, the basic URL parser, steps 1 to 3}
 */
const parserInput = (address: string): string => {
  let at = 0;
  while (at < address.length && (address.codePointAt(at) ?? 0) <= 0x20) {
    at += 1;
  }

  return address.slice(at).replaceAll(/[\t\n\r]/gu, "");
};

/**
 * Whether an address is no path relative to its document as the URL Standard's states read it: the
 * scheme start and scheme states find a scheme (an ASCII letter, then ASCII alphanumerics, `+`, `-`
 * and `.`, then `:`), or its first character is `/` or `\`, which the relative and relative slash
 * states read as a path from the root or, doubled, an authority.
 *
 * @param address - The address as written.
 * @returns Whether Media path refuses it, wherever it is fetched.
 * @see {@link https://url.spec.whatwg.org/#scheme-start-state | URL Standard, scheme start state}
 * @see {@link https://url.spec.whatwg.org/#relative-state | URL Standard, relative state}
 */
const nonRelative = (address: string): boolean => {
  const read = parserInput(address);

  return /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(read) || read.startsWith("/") || read.startsWith("\\");
};

/**
 * The element kind of each governor: a kind governs itself, and a (kind, type) governor its kind.
 */
const kindOfGovernor = new Map(
  grammar.attributes.governor.rows.map(({ governor, kind }) => [governor, kind] as const),
);

/**
 * Whether the reference census resolves an attribute of an element: a row of `ReferenceAttribute`
 * for its version, kind and name, read from the grammar.
 *
 * @param version - The schema version.
 * @param kind - The element's kind.
 * @param name - The attribute's name.
 * @returns Whether the import writes the attribute a `Reference`.
 */
const censusResolves = (version: string, kind: string, name: string): boolean =>
  grammar.references.referenceAttribute.rows.some(
    (row) => row.version === version && row.kind === kind && row.name === name,
  );

/**
 * One fetched attribute under one of its governors.
 */
interface FetchedField {
  readonly governor: string;
  readonly kind: string;
  readonly name: string;
}

/**
 * Every fetched attribute under every governor it is fetched under, with the governor's element
 * kind: the fetching kind's own, or another kind's under an `xsi:type`.
 */
const fetchedFields: readonly FetchedField[] = fetchedAttributes.flatMap(({ kind, name }) =>
  governorsOf([kind]).map((governor) => ({
    governor,
    kind: kindOfGovernor.get(governor) ?? governor,
    name,
  })),
);

/**
 * Attributes the player never fetches, which Media path leaves free: a link, identifiers written as
 * URIs, an image's text, response processing's template, a MathML element's link, and references
 * that name a document: an item ref's, a stimulus ref's and an include's.
 */
const freeFields = [
  { governor: "a", kind: "a", name: "href" },
  { governor: "img", kind: "img", name: "longdesc" },
  { governor: "img", kind: "img", name: "alt" },
  {
    governor: "qti-portable-custom-interaction",
    kind: "qti-portable-custom-interaction",
    name: "custom-interaction-type-identifier",
  },
  { governor: "qti-response-processing", kind: "qti-response-processing", name: "template" },
  { governor: "m:mglyph", kind: "m:mglyph", name: "href" },
  { governor: "qti-assessment-item-ref", kind: "qti-assessment-item-ref", name: "href" },
  { governor: "qti-assessment-stimulus-ref", kind: "qti-assessment-stimulus-ref", name: "href" },
  { governor: "xi:include", kind: "xi:include", name: "href" },
] as const;

/**
 * The governors whose text a player fetches, each with its element kind.
 */
const fetchedTextFields = governorsOf(fetchedTexts).map((governor) => ({
  governor,
  kind: kindOfGovernor.get(governor) ?? governor,
}));

/**
 * The fetched kinds whose text the text census resolves, read from the census.
 */
const resolvedTexts = new Set(textReferenceKinds.map(({ kind }) => kind));

/**
 * The pieces a drawn address is made of: paths of the package, a climb, schemes in several
 * spellings and with a tab or a newline among their letters, a `data:` scheme, a network path, an
 * absolute path, backslashes, a query, a fragment, and whitespace and a C0 control the URL Standard
 * strips.
 */
const addressPieces = [
  "media/",
  "stars/1.svg",
  "../",
  "./",
  "https://elsewhere.example.test/",
  "HTTPS:",
  "ht\ttp:",
  "data:",
  "DaTa:",
  "d\nata:",
  "mailto:",
  "c:",
  "a+b.c-d:",
  "1a:",
  "a b:",
  "//",
  "/",
  "\\",
  "?q",
  "#f",
  ":",
  " ",
  "\t",
  "\n",
  "\u0001",
  "&media;",
] as const;

/**
 * Draw an address from {@link addressPieces}.
 */
const addressOf = array(element(addressPieces), { max: 6, min: 0 });

/**
 * The features Media path's value search steers by: a fetched attribute and a fetched text, each
 * admitted and refused, an attribute or a text no census resolves, refused, and a free field and a
 * free text, admitted.
 */
const pathFeatures = [
  "attribute admitted",
  "attribute refused",
  "unresolved attribute refused",
  "text admitted",
  "text refused",
  "unresolved text refused",
  "free admitted",
] as const;

/**
 * Where a drawn value of Media path stands: an attribute, under its governor and name, or an
 * element's text, under its governor; fetched, or free.
 */
type PathField =
  | {
      readonly _tag: "attribute";
      readonly fetched: boolean;
      readonly governor: string;
      readonly kind: string;
      readonly name: string;
    }
  | {
      readonly _tag: "text";
      readonly fetched: boolean;
      readonly governor: string;
      readonly kind: string;
    };

describe("qti/media.ts, Media path over a value", () => {
  it.effect(
    "admits a fetched attribute exactly when the census resolves it and the URL Standard reads no scheme and no first slash or backslash in it, a fetched text exactly when the text census resolves it and the same holds, every free field whatever it holds; and each value it admits resolves relative to its document",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required(pathFeatures, { cases: 400, sense: notesOnly }),
            draw: drawn((source) => {
              const policy = source.draw(element(policies));
              const where = source.draw(
                element(["attribute", "free", "text", "free text"] as const),
              );
              const value = source.draw(addressOf).join("");
              const fields: Readonly<Record<typeof where, () => PathField>> = {
                attribute: () => ({
                  _tag: "attribute",
                  fetched: true,
                  ...source.draw(element(nonEmpty(fetchedFields, "fetched field"))),
                }),
                free: () => ({
                  _tag: "attribute",
                  fetched: false,
                  ...source.draw(element(freeFields)),
                }),
                "free text": () => ({
                  _tag: "text",
                  fetched: false,
                  governor: "qti-value",
                  kind: "qti-value",
                }),
                text: () => ({
                  _tag: "text",
                  fetched: true,
                  ...source.draw(element(nonEmpty(fetchedTextFields, "fetched text"))),
                }),
              };

              return {
                field: fields[where](),
                policy,
                value,
                version: source.draw(element(nonEmpty(grammar.kinds.versions.handles, "version"))),
              };
            }),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "the URL Standard's basic URL parser (its strip, its tab and newline removal, its scheme and relative states), Node's URL for each admitted value, and the reference census read from the grammar",
            },
            runs: 4000,
            shrink: completeShrink,
            steerEvery: 32,
            suite: "qti/media/path",
          },
          ({ field, policy, value, version }, c) =>
            Effect.sync(() => {
              const resolved =
                field._tag === "text"
                  ? resolvedTexts.has(field.kind)
                  : censusResolves(version, field.kind, field.name);
              const admitted = !field.fetched || (resolved && !nonRelative(value));
              const verdict =
                field._tag === "text"
                  ? checkOf(
                      policy,
                      "Media path",
                      "Node",
                    )({
                      governor: field.governor,
                      kind: field.kind,
                      stringValue: value,
                      version,
                    })
                  : checkOf(
                      policy,
                      "Media path",
                      "Attribute",
                    )({
                      governor: field.governor,
                      kind: field.kind,
                      lexical: value,
                      name: field.name,
                      version,
                    });
              const shown = `${Formatter.format(field)} ${version} ${JSON.stringify(value)}`;

              assert.strictEqual(verdict, admitted, shown);
              if (!field.fetched) {
                c.note("free admitted");

                return;
              }

              c.note(
                resolved
                  ? `${field._tag} ${verdict ? "admitted" : "refused"}`
                  : `unresolved ${field._tag} refused`,
              );
              if (verdict) {
                assert.isTrue(resolvesRelative(value), `${shown}: resolves off its document`);
              }
            }),
        ),
      ),
  );
});

/**
 * The scopes a reference's resolution writes (`#pantry/qti/package.ts` `HrefScope`).
 */
const scopes = ["entry", "external", "document", "unresolved"] as const;

/**
 * One reference of the space Media path's resolution test exhausts: an attribute's, by its
 * element's kind and its name, or an element's text, by its kind; fetched or not; and its scope.
 */
type ReferenceCase =
  | {
      readonly _tag: "attribute";
      readonly fetched: boolean;
      readonly kind: string;
      readonly name: string;
      readonly scope: (typeof scopes)[number];
    }
  | {
      readonly _tag: "text";
      readonly fetched: boolean;
      readonly kind: string;
      readonly scope: (typeof scopes)[number];
    };

/**
 * Every reference the census resolves, fetched or not, in every scope; and every text reference.
 */
const referenceCases: readonly ReferenceCase[] = [
  ...Arr.dedupeWith(
    grammar.references.referenceAttribute.rows.map(({ kind, name }) => ({ kind, name })),
    (x, y) => x.kind === y.kind && x.name === y.name,
  ).flatMap(({ kind, name }) =>
    scopes.map((scope): ReferenceCase => ({
      _tag: "attribute",
      fetched: fetchedAttributes.some((row) => row.kind === kind && row.name === name),
      kind,
      name,
      scope,
    })),
  ),
  ...textReferenceKinds.flatMap(({ kind }) =>
    scopes.map((scope): ReferenceCase => ({
      _tag: "text",
      fetched: fetchedTexts.some((fetched) => fetched === kind),
      kind,
      scope,
    })),
  ),
];

describe("qti/media.ts, Media path over a reference", () => {
  it.effect(
    "admits a fetched reference exactly when it resolved in the package, and every other reference, a manifest's, an item ref's or an include's among them, in every scope: every census reference in every scope, exhausted",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every reference the census resolves and every text reference, in every HrefScope",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace([
              "fetched entry admitted",
              "fetched elsewhere refused",
              "free admitted",
            ] as const),
            generator: (source) => source.draw(element(nonEmpty(referenceCases, "reference"))),
            limit: referenceCases.length,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "the policy's package-relative fetch: a fetched field's reference resolved in the package (HrefScope entry), and no other reference read",
            },
            suite: "qti/media/path-scope",
          },
          (reference, c) =>
            Effect.sync(() => {
              const verdict =
                reference._tag === "text"
                  ? checkOf(
                      ownPolicy,
                      "Media path",
                      "TextReference",
                    )({
                      kind: reference.kind,
                      scope: reference.scope,
                    })
                  : checkOf(
                      ownPolicy,
                      "Media path",
                      "Reference",
                    )({
                      kind: reference.kind,
                      name: reference.name,
                      scope: reference.scope,
                    });
              const admitted = !reference.fetched || reference.scope === "entry";

              assert.strictEqual(verdict, admitted, Formatter.format(reference));
              if (reference.fetched) {
                c.note(admitted ? "fetched entry admitted" : "fetched elsewhere refused");
              } else {
                c.note("free admitted");
              }
            }),
        ),
      ),
  );
});

/**
 * The pieces a drawn entry path is made of: segments, dots, extensions the policies list and ones
 * they do not, in other cases and spellings, and a leading dot.
 */
const pathPieces = [
  "media",
  "/",
  ".",
  "..",
  "svg",
  "SVG",
  "Svg",
  "png",
  "jpg",
  "jpeg",
  "JPG",
  "css",
  "xml",
  "mp4",
  "m4a",
  "webm",
  "stars",
  "1",
  "x",
] as const;

/**
 * Draw an entry path from {@link pathPieces}.
 */
const entryPathOf = array(element(pathPieces), { max: 7, min: 1 });

/**
 * The features Media type's search steers by.
 */
const typeFeatures = [
  "fetched admitted",
  "fetched refused",
  "text admitted",
  "text refused",
  "free admitted",
] as const;

/**
 * Where a drawn path of Media type stands: a fetched reference, by its element's kind and its
 * attribute's name, a fetched text reference, by its kind, or a reference that names a document.
 */
type TypeField =
  | {
      readonly _tag: "reference";
      readonly fetched: boolean;
      readonly kind: string;
      readonly name: string;
    }
  | { readonly _tag: "text"; readonly fetched: boolean; readonly kind: string };

/**
 * References that name a document rather than fetched media, which Media type leaves free: an item
 * ref's, a section ref's, a stimulus ref's, an include's and a link's, and a resource icon's text.
 */
const documentReferences: readonly TypeField[] = [
  { _tag: "reference", fetched: false, kind: "qti-assessment-item-ref", name: "href" },
  { _tag: "reference", fetched: false, kind: "qti-assessment-section-ref", name: "href" },
  { _tag: "reference", fetched: false, kind: "qti-assessment-stimulus-ref", name: "href" },
  { _tag: "reference", fetched: false, kind: "xi:include", name: "href" },
  { _tag: "reference", fetched: false, kind: "a", name: "href" },
  { _tag: "text", fetched: false, kind: "qti-resource-icon" },
];

/**
 * The fetched references the census resolves: each fetched attribute it holds, and each fetched
 * text it holds.
 */
const fetchedReferences: readonly TypeField[] = [
  ...fetchedAttributes.flatMap(({ kind, name }): readonly TypeField[] =>
    grammar.kinds.versions.handles.some((version) => censusResolves(version, kind, name))
      ? [{ _tag: "reference", fetched: true, kind, name }]
      : [],
  ),
  ...fetchedTexts.flatMap((kind): readonly TypeField[] =>
    resolvedTexts.has(kind) ? [{ _tag: "text", fetched: true, kind }] : [],
  ),
];

describe("qti/media.ts, Media type", () => {
  it.effect(
    "admits a fetched reference's entry exactly when the extension of its last segment, as Node's path.extname reads it, is one the policy lists, matched as written, and every reference that names a document whatever its extension",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required(typeFeatures, { cases: 400, sense: notesOnly }),
            draw: drawn((source) => ({
              entryPath: source.draw(entryPathOf).join(""),
              field: source.draw(
                element(
                  nonEmpty(
                    source.draw(element([fetchedReferences, documentReferences] as const)),
                    "reference",
                  ),
                ),
              ),
              policy: source.draw(element(policies)),
            })),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "Node's path.posix.extname of the path's last segment, the extension after its dot, a key of the policy's media record",
            },
            runs: 4000,
            shrink: completeShrink,
            steerEvery: 32,
            suite: "qti/media/type",
          },
          ({ entryPath, field, policy }, c) =>
            Effect.sync(() => {
              const extension = path.posix
                .extname(entryPath.slice(entryPath.lastIndexOf("/") + 1))
                .slice(1);
              const admitted = !field.fetched || Object.hasOwn(policy.media, extension);
              const verdict =
                field._tag === "text"
                  ? checkOf(
                      policy,
                      "Media type",
                      "TextReferencePath",
                    )({ kind: field.kind, path: entryPath })
                  : checkOf(
                      policy,
                      "Media type",
                      "ReferencePath",
                    )({
                      kind: field.kind,
                      name: field.name,
                      path: entryPath,
                    });

              assert.strictEqual(
                verdict,
                admitted,
                `${Formatter.format(field)} ${JSON.stringify(entryPath)} under ${Object.keys(policy.media).join(", ")}`,
              );
              if (field.fetched) {
                c.note(
                  `${field._tag === "text" ? "text" : "fetched"} ${verdict ? "admitted" : "refused"}`,
                );
              } else {
                c.note("free admitted");
              }
            }),
        ),
      ),
  );
});

/**
 * Attributes Media data reads, each with how its value holds addresses: an `xs:anyURI` attribute's
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
 * Element texts Media data reads: a `qti-file-href`'s and an adaptation's, each an `xs:anyURI`, and
 * a value's, which is none.
 */
const dataTexts = [
  { form: "address", governor: "qti-file-href", version: "3.0.0" },
  { form: "address", governor: "drd:hasAdaptation", version: "3.0.1" },
  { form: "none", governor: "qti-value", version: "3.0.0" },
] as const;

/**
 * The features Media data's search steers by.
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
 * Judge one value of Media data by the URL Standard: refused exactly when an address it holds
 * parses with the scheme `data`, the whole value for an `xs:anyURI` and each whitespace-separated
 * token for a list.
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

describe("qti/media.ts, Media data", () => {
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
            suite: "qti/media/data",
          },
          ({ field, policy, value }, c) =>
            Effect.sync(() => {
              const admitted = dataReading(field.form, value);
              const verdict =
                field._tag === "text"
                  ? checkOf(
                      policy,
                      "Media data",
                      "Node",
                    )({
                      governor: field.governor,
                      stringValue: value,
                      version: field.version,
                    })
                  : checkOf(
                      policy,
                      "Media data",
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

describe("qti/media.ts, Media style", () => {
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
            suite: "qti/media/style",
          },
          ({ name, policy, value }, c) =>
            Effect.sync(() => {
              const lowered = value.toLowerCase();
              const fetching = ["url(", "@import", "image-set(", "src(", "\\"];
              const admitted = name !== "style" || !fetching.some((text) => lowered.includes(text));
              const verdict = checkOf(
                policy,
                "Media style",
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

describe("qti/media.ts, Media foreign", () => {
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
            suite: "qti/media/foreign",
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
                  ? checkOf(ownPolicy, "Media foreign", "Node")({ kind: handle.handle })
                  : checkOf(ownPolicy, "Media foreign", "Attribute")({ name: handle.handle });

              assert.strictEqual(verdict, !refused, handle.handle);
              c.note(`${handle._tag} ${verdict ? "admitted" : "refused"}`);
            }),
        ),
      );
    },
  );
});

/**
 * Write a package as an install publishes one: a manifest whose resources name `.xml` documents, a
 * test whose item ref names its item, and an item that fetches two pictures of the package, each a
 * file of its resource, and, with `stylesheet`, a stylesheet too.
 *
 * @param stylesheet - Whether the item fetches a `.css` stylesheet as well.
 * @returns Its entries, each encoded as UTF-8.
 */
const publishedPackage = (stylesheet: boolean): PackageEntries => {
  const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";
  const declaration = '<?xml version="1.0" encoding="UTF-8"?>';
  const text = new TextEncoder();
  const star = (points: string) =>
    text.encode(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><polygon points="${points}"/></svg>\n`,
    );

  return new Map([
    [
      "imsmanifest.xml",
      text.encode(
        [
          declaration,
          '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="published-manifest">',
          "  <metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata>",
          "  <organizations/>",
          "  <resources>",
          '    <resource identifier="item-res" type="imsqti_item_xmlv3p0" href="items/stars-01.xml">',
          '      <file href="items/stars-01.xml"/>',
          '      <file href="items/media/stars/1.svg"/>',
          '      <file href="items/media/stars/2.svg"/>',
          stylesheet ? '      <file href="items/media/item.css"/>' : "",
          "    </resource>",
          '    <resource identifier="test-res" type="imsqti_test_xmlv3p0" href="test.xml">',
          '      <file href="test.xml"/>',
          '      <dependency identifierref="item-res"/>',
          "    </resource>",
          "  </resources>",
          "</manifest>",
          "",
        ].join("\n"),
      ),
    ],
    [
      "items/stars-01.xml",
      text.encode(
        [
          declaration,
          `<qti-assessment-item xmlns="${asi}" identifier="stars-01" title="Stars" adaptive="false" time-dependent="false">`,
          stylesheet ? '  <qti-stylesheet href="media/item.css" type="text/css"/>' : "",
          "  <qti-item-body>",
          '    <p><img src="media/stars/1.svg" alt="one star"/></p>',
          '    <p><img src="media/stars/2.svg" alt="two stars"/></p>',
          "  </qti-item-body>",
          "</qti-assessment-item>",
          "",
        ].join("\n"),
      ),
    ],
    ["items/media/stars/1.svg", star("5,0 6,4 10,4 7,6 8,10 5,7 2,10 3,6 0,4 4,4")],
    ["items/media/stars/2.svg", star("0,0 10,0 10,10 0,10")],
    ...(stylesheet
      ? [["items/media/item.css", text.encode("img { width: 4em; }\n")] as const]
      : []),
    [
      "test.xml",
      text.encode(
        [
          declaration,
          `<qti-assessment-test xmlns="${asi}" identifier="published" title="Published">`,
          '  <qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual">',
          '    <qti-assessment-section identifier="S" title="S" visible="true">',
          '      <qti-assessment-item-ref identifier="I" href="items/stars-01.xml"/>',
          "    </qti-assessment-section>",
          "  </qti-test-part>",
          "</qti-assessment-test>",
          "",
        ].join("\n"),
      ),
    ],
  ]);
};

/**
 * Judge every check a policy states over a package's rows, as PostgreSQL evaluates each CHECK on
 * each row it holds: the checks each row breaks, by law and relation, with the row's identifying
 * fields.
 *
 * @param policy - The policy.
 * @param rows - The package's rows, as the database holds them.
 * @returns Each refusal as `law over relation: row`, and how many rows the checks read.
 */
const policyRefusals = (policy: MediaPolicy, rows: HostRows) => {
  const refusals: string[] = [];
  let read = 0;
  for (const [law, statements] of Object.entries(mediaLawsByName(Option.some(policy)))) {
    for (const statement of statements) {
      for (const judged of judgedOf(statement, [])) {
        if (judged.kind !== "check") {
          continue;
        }

        assert.deepStrictEqual(judged.unread, [], `${law} over ${judged.relation}`);
        for (const row of rows.get(judged.relation) ?? []) {
          const verdict = judged.value(row);
          read += 1;

          assert.isDefined(
            verdict,
            `${law} over ${judged.relation}: a field it reads is absent from ${Formatter.format(row)}`,
          );
          if (!verdict) {
            refusals.push(`${law} over ${judged.relation}: ${Formatter.format(row)}`);
          }
        }
      }
    }
  }

  return { read, refusals };
};

layer(NodeServices.layer, { excludeTestServices: true })(
  "qti/media.ts, a package as an install publishes it",
  (withServices) => {
    withServices.effect(
      "is accepted under the nine-type roster with its manifest, item ref and documents named .xml, and refused under Media type alone once its item fetches a .css stylesheet",
      () =>
        // Oracle: the specification as a checker, the policy's laws as the module states them: a
        // fetched .svg of the package is admitted under a roster that lists svg, a fetched .css is
        // refused under one that does not, and no reference that names a document is read; and the
        // host judge's every law of this package's own install, which the package keeps. Bound:
        // one package, with its stylesheet and without.
        Effect.scoped(
          Effect.gen(function* published() {
            const accepted = hostRowsOf(
              (yield* readProgram(yield* scopedPackage(publishedPackage(false)))).inputs,
            );
            const xmlPaths = (accepted.get("ReferencePath") ?? []).filter(
              (row) => Predicate.isString(row["path"]) && row["path"].endsWith(".xml"),
            );
            const svgPaths = (accepted.get("ReferencePath") ?? []).filter(
              (row) => Predicate.isString(row["path"]) && row["path"].endsWith(".svg"),
            );

            assert.lengthOf(xmlPaths, 1, "the item ref's resolved path, an .xml document");
            assert.lengthOf(svgPaths, 2, "the item's two pictures");
            assert.isNotEmpty(accepted.get("File") ?? [], "the manifest's files, .xml among them");
            assert.deepStrictEqual(
              judge(accepted, judgedLaws(Qti)).broken.map(({ law }) => Formatter.format(law)),
              [],
              "this package's own install keeps the package",
            );

            const acceptedRefusals = policyRefusals(ownPolicy, accepted);

            assert.isAbove(acceptedRefusals.read, 0);
            assert.deepStrictEqual(acceptedRefusals.refusals, [], "the nine-type roster");

            const styled = hostRowsOf(
              (yield* readProgram(yield* scopedPackage(publishedPackage(true)))).inputs,
            );
            const { refusals } = policyRefusals(ownPolicy, styled);

            assert.lengthOf(refusals, 1, refusals.join("\n"));
            assert.match(refusals[0] ?? "", /^Media type over ReferencePath: /u);
            assert.include(refusals[0], "items/media/item.css");
            assert.deepStrictEqual(
              policyRefusals({ media: { ...ownPolicy.media, css: "text/css" } }, styled).refusals,
              [],
              "a roster that lists css",
            );
          }),
        ),
      300_000,
    );
  },
);

/**
 * Every statement of a record of statements by law, in the record's order.
 *
 * @param byName - The statements by law.
 * @returns The statements.
 */
const flat = (byName: Readonly<Partial<Record<string, readonly Statement[]>>>) =>
  Object.values(byName).flatMap((statements) => statements ?? []);

describe("qti/media.ts, the laws a policy states", () => {
  it("names each law by a row of the law table, each check by its law, and a refusal under any one by the table's rule, so an import refused by one is reported, never unowned", () => {
    for (const policy of policies) {
      const byName = mediaLawsByName(Option.some(policy));

      assert.sameMembers(Object.keys(byName), Object.keys(policyLaws), JSON.stringify(policy));
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
            const refusal = refusalOf(
              { kind: "every", laws: [refusedOf(refused)] },
              { kind: "unreported" },
              grammar,
            );

            assert.deepStrictEqual(
              refusal.rules,
              [lawTable[law].rule],
              `${name} over ${statement.relation.name}`,
            );
          }
        }
      }
    }
  });

  it("states Media type over a roster of no extension as no fetched entry at all", () => {
    const refuses = checkOf({ media: {} }, "Media type", "ReferencePath");

    assert.isFalse(refuses({ kind: "img", name: "src", path: "media/a.svg" }));
    assert.isTrue(refuses({ kind: "qti-assessment-item-ref", name: "href", path: "item.xml" }));
  });

  it("builds Qti for no policy and for a policy, each call its own: every module's statements, then the policy's, then its queries' rules", () => {
    const own = qtiLevelsOf(Option.none());
    const built = qtiLevelsOf(Option.some(ownPolicy));
    const [ownMedia, ...ownQueries] = own.lawsByName;
    const [builtMedia, ...builtQueries] = built.lawsByName;
    const moduleStatements: readonly unknown[] = own.base.statements;
    const builtStatements: readonly unknown[] = built.qti.statements;
    const expected = [...moduleStatements, ...flat(builtMedia), ...builtQueries.flatMap(flat)];

    assert.deepStrictEqual(mediaLawsByName(Option.none()), {});
    assert.deepStrictEqual(flat(ownMedia), []);
    assert.notStrictEqual(qtiSchema(Option.some(ownPolicy)), built.qti, "each call its own");
    assert.strictEqual(builtStatements.length, expected.length);
    assert.isTrue(
      builtStatements.every((statement, at) => statement === expected[at]),
      "every module's statements, then the policy's, then the queries' rules, each the very statement this build holds",
    );
    assert.strictEqual(builtQueries.flatMap(flat).length, ownQueries.flatMap(flat).length);
    assert.sameOrderedMembers(Object.keys(built.qti.relations), Object.keys(own.qti.relations));
    assert.isTrue(
      Object.entries(built.base.relations).every(
        ([name, relation]) =>
          Object.getOwnPropertyDescriptor(own.base.relations, name)?.value === relation,
      ),
      "the same stored relations",
    );
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
