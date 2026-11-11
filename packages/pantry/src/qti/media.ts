/**
 * The package-media level, `QtiMedia`: the laws an application stacks over `Qti` with grizzle's
 * `schema.extend`, so the database refuses a fetch of anything but a file of the package whose
 * extension the application's policy lists, and pantry's importer states nothing of them. The
 * policy is data, the rows of {@link MediaType}, each extension a player may fetch with the media
 * type the application serves its files with, which the application writes as its own rows. A
 * player fetches each such file from wherever the application serves the package's files, by the
 * entry's digest (`Entry.digest`), with the media type the policy gives its extension, and holds no
 * file nothing names.
 *
 * A level reaches the relations below it only through a query (README, "Levels"), so each law is a
 * rule over a derived relation of `QtiMedia` that reads `Qti`'s tables, which deferred triggers
 * judge at commit (README, "Rules over queries"), and every writer meets it. A refusal by one is
 * grizzle's `{ kind: "above", level: "QtiMedia", law }` to a login over `Qti`, and the law's own to
 * a login over `QtiMedia`; it names its law and rule as any other refusal does.
 *
 * - **Media path** (rule `media-path`): every address a player fetches, each field
 *   `#pantry/vocab/fetched.ts` declares, names a file of the package, which `file-exists` holds to
 *   an `Entry`:
 *
 *   - An attribute fetched under any governor of its kind's type ({@link governorsOf}) is one the
 *     reference census resolves (`ReferenceAttribute`), and the text of a fetched element is one the
 *     text census resolves (`textReferenceKinds` of `#pantry/grammar/references.ts`), so the import
 *     writes it a `Reference` or a `TextReference`;
 *   - That reference resolved in the package (its `HrefScope` is `entry`), so it has its
 *     `ReferencePath` or `TextReferencePath`: no external address, none above the package's root or
 *     under an `xml:base` outside it, and no same-document reference (an empty one, a query or a
 *     fragment alone);
 *   - Its value holds no scheme, `data:` among them, and starts with no `/` or `\`, an absolute path or
 *     a network path's `//` authority, as the URL Standard reads it ({@link nonRelative}).
 *
 *   So it refuses, whatever they hold, the fetched fields no census resolves: a
 *   `qti-interaction-module`'s `primary-path` and `fallback-path`, which name a module the loader
 *   resolves and extends with `.js`, not a file; the text of a `qti-file-href` other than a card's (a
 *   calculator's or a digital material's), which the information model does not hold to the package;
 *   and an attribute fetched under the governor of another kind's type (a `qti-null` governed by
 *   `ImgDType`), since the census reads an element by its kind. None of them names an entry a law can
 *   hold, so none could be served as a file of the package.
 * - **Media type** (rule `media-type`): every entry a fetched reference resolves to has an extension
 *   a {@link MediaType} row lists: the text after the last `.` of its path's last segment, where
 *   that `.` is not the segment's first character, as Node's `path.posix.extname` reads that
 *   segment ({@link extensionPattern}), so a path that ends with `/` has none; matched
 *   case-sensitively, so `photo.JPG` and `photo.jpeg` are refused under a policy that lists `jpg`.
 *   The law reads the reference's resolved path, which `file-exists` holds to be the entry's own.
 * - **Media data** (rule `media-data`): no address uses the `data:` scheme, so no value carries a
 *   base64 payload: no admitted attribute and no element text whose domain is an `xs:anyURI`, links
 *   and identifiers included, as the URL Standard reads its scheme ({@link dataScheme}), and no
 *   token of an address list (`xsi:schemaLocation`). A `source`'s `src` and `srcset`, a `video`'s
 *   `poster` and an `object`'s `data` are fetched fields typed as strings rather than `xs:anyURI`
 *   (`URLDType`, `xs:normalizedString`), and Media path refuses a scheme in every fetched field,
 *   `data:` among them.
 * - **Media style** (rule `media-style`): no `style` attribute holds `url(`, `@import`, `image-set(`
 *   or `src(`, in any case, or a backslash, which begins a CSS escape ({@link styleFetch}).
 * - **Media foreign** (rule `media-foreign`): no markup pantry keeps but cannot interpret, which
 *   could carry an address no law above reads: no foreign element, of any of the three namespace
 *   classes (`foreignKinds` of `#pantry/grammar/kinds.ts`), and no attribute of an open class but
 *   `data-*`, so no `foreign`, `no-namespace` or `own-namespace` attribute. A `data-*` attribute is
 *   kept, as QTI writes them (`data-catalog-idref`).
 * - **Entry used** (rule `entry-used`): every entry is the manifest, a document (`Document`), or the
 *   path a reference resolves to in the package (`ReferencePath`) or a text reference does
 *   (`TextReferencePath`). "File exists" holds every resolved path to an entry, so the package's
 *   files and what its documents name match one to one, and a file nothing names, a stray schema or
 *   an unused picture, is refused, naming the law. It is a check over {@link UnusedEntry}, the
 *   entries no document and no resolved reference names, which holds each to be the manifest, so a
 *   refused import names it by its check's name as it names every law of the policy. It is the
 *   policy's and not `Qti`'s own: IMS Content Packaging 1.2 has every file a manifest or a document
 *   names be in the package, never the reverse, and QTI packages list files no document references
 *   (the 1EdTech examples list their XSDs and unused media), so this package's own install keeps
 *   them, as the spec readings read the specifications. An install that serves only what its items
 *   name states it, and imports only what it serves.
 *
 * The laws read only the fields `#pantry/vocab/fetched.ts` declares, but Entry used: a manifest's
 * `href`, an item, section or stimulus ref's, an `xi:include`'s, a link's and every other reference
 * that names a document rather than fetched media stays `file-exists`'s alone, whatever its
 * extension, and Entry used reads every resolved reference.
 *
 * Every check is named by its law with spaces written as underscores, as every check of the schema
 * is (`#pantry/import/refusal.ts` `checkNameOf`).
 *
 * @see {@link https://url.spec.whatwg.org/#concept-basic-url-parser | URL Standard, the basic URL parser}
 * @see {@link https://nodejs.org/api/path.html#pathextnamepath | Node.js, path.extname}
 */
import {
  check,
  Compute,
  derived,
  generated,
  key,
  on,
  query,
  relation,
  schema,
  str,
  v,
} from "@bjornpagen/grizzle";
import { Array as Arr, Option } from "effect";
import {
  AttributeGrammar,
  AttributeModelOf,
  grammar,
  TextDomain,
} from "#pantry/grammar/install.ts";
import { foreignKinds, openClasses } from "#pantry/grammar/kinds.ts";
import { textReferenceKinds } from "#pantry/grammar/references.ts";
import { Attribute, dataScheme, leadingStripped, tabOrNewline } from "#pantry/qti/attributes.ts";
import { Document } from "#pantry/qti/chardata.ts";
import { Node } from "#pantry/qti/node.ts";
import {
  Entry,
  Reference,
  ReferencePath,
  TextReference,
  TextReferencePath,
} from "#pantry/qti/package.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { addressLists, fetchedAttributes, fetchedTexts } from "#pantry/vocab/fetched.ts";
import { manifestPath } from "#pantry/vocab/terms/package.ts";

/**
 * An address that is no path relative to its document, as the URL Standard reads one against the
 * player's page: past the leading C0 controls and spaces it strips, a scheme (an ASCII letter, then
 * letters, digits, `+`, `-` and `.`, any tab or newline among them removed, then the colon that
 * ends it), `data:` among them; or a first `/` or `\`, which the URL Standard reads alike for a
 * special scheme's URL, the start of an absolute path or, doubled, of a network path's authority.
 *
 * @see {@link https://url.spec.whatwg.org/#scheme-start-state | URL Standard, scheme start state}
 * @see {@link https://url.spec.whatwg.org/#relative-state | URL Standard, relative state}
 */
export const nonRelative = Compute.pattern<string>(
  `^[${leadingStripped}]*(?:[A-Za-z][A-Za-z0-9+.\\-${tabOrNewline}]*:|[/\\\\])`,
);

/**
 * A path with an extension, as Node's `path.posix.extname` reads one in its last segment: a `.` in
 * that segment, not its first character, followed by at least one character, none a `.` or a `/`.
 * The extension is what follows that `.`.
 *
 * @see {@link https://nodejs.org/api/path.html#pathextnamepath | Node.js, path.extname}
 */
const extensionPattern = Compute.pattern<string>(String.raw`[^/]\.[^./]+$`);

/**
 * The governors an element kind's attributes and text are read under: the kind itself, and every
 * governor whose type is the kind's declared type in some version, as an `xsi:type` naming that
 * type makes it govern an element of another kind (`Governor` of `#pantry/grammar/install.ts`).
 *
 * @param kinds - The element kinds.
 * @returns Their governors, each once.
 */
export const governorsOf = (kinds: readonly string[]): readonly string[] => {
  const types = new Set(
    kinds.flatMap((kind) =>
      grammar.kinds.versions.handles.flatMap((version) =>
        Option.toArray(grammar.xsi.declaredType(version, kind)),
      ),
    ),
  );

  return Arr.dedupe([
    ...kinds,
    ...grammar.attributes.governor.rows.flatMap(({ governor, governs }) =>
      types.has(governs) ? [governor] : [],
    ),
  ]);
};

/**
 * The fetched attributes by name, each with the governors of every kind that fetches it.
 */
const fetchedNames = Object.values(Arr.groupBy(fetchedAttributes, ({ name }) => name)).map(
  (rows) => ({ governors: governorsOf(rows.map(({ kind }) => kind)), name: rows[0].name }),
);

/**
 * The governors whose text a player fetches.
 */
const textGovernors = governorsOf(fetchedTexts);

/**
 * The fetched element kinds whose text the text census resolves: the only ones whose text the
 * import writes a `TextReference` of.
 */
const resolvedTextKinds = fetchedTexts.filter((kind) =>
  textReferenceKinds.some((resolved) => resolved.kind === kind),
);

/**
 * The value domains that are an `xs:anyURI`'s: every domain whose primitive is `anyURI`.
 */
const uriDomains = grammar.attributes.valueDomain.rows.flatMap(({ domain, primitive }) =>
  primitive === "anyURI" ? [domain] : [],
);

/**
 * The open attribute classes Media foreign refuses: every class but `data-*`.
 */
const uninterpretedClasses = openClasses.filter((name) => name !== "data-*");

/**
 * A file extension a policy lists: lowercase ASCII letters and digits, without its dot, as an
 * entry's path writes it after its last `.` (`photo.jpg` is `jpg`). An extension matches as
 * written, so a policy lists one spelling of each and a path in another case is refused.
 */
export const MediaExtension = str.regex("^[a-z0-9]{1,127}$");

/**
 * The media type a policy serves an extension's files with, as an HTTP `Content-Type` names it: a
 * type and a subtype, each a restricted name (RFC 6838, §4.2), in lower case, the form the registry
 * writes, with no parameter.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc6838#section-4.2 | RFC 6838, §4.2 Naming Requirements}
 */
export const MediaTypeName = str.regex(
  "^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$",
);

/**
 * An extension with its dot before it, as a path ends with it.
 */
const Suffix = str.regex("^[.][a-z0-9]{1,127}$");

/**
 * The application's media policy, one row per extension a player may fetch: the extension, the
 * media type the application serves its files with, and `suffix`, the extension with its dot, as a
 * path ends with it, which PostgreSQL generates. Each media type is listed under one extension, its
 * one spelling ("Media type", a key on `type`): a policy that lists `jpg` for `image/jpeg` lists no
 * `jpeg`. A policy of no row admits no fetched entry at all.
 */
export const MediaType = relation.generated(
  "MediaType",
  { extension: MediaExtension, type: MediaTypeName },
  ["extension"],
  (m) => ({
    suffix: generated(
      Suffix,
      Compute.concat(Compute.literal(str.regex("^[.]$"), "."), m.extension),
    ),
  }),
);

/**
 * The policy's level over `Qti`: {@link MediaType}, the rows the level's rules read, a level of its
 * own since a derived relation reads only the levels below its own.
 *
 * An application writes these rows through a role of their own, one that writes nothing its READ
 * COMMITTED readers read. The media laws read `MediaType`, so a role writing it beside relations a
 * reader reads gives grizzle's certifier another writer of that reader's reads, and it lifts the
 * reader to SERIALIZABLE (found by edullm: a publisher that also wrote the policy moved its
 * learner).
 */
export const QtiMediaPolicy = schema.extend(Qti, "QtiMediaPolicy", { MediaType }, [
  key(on(MediaType, "type")),
]);

/**
 * Every attribute, by its key, with what the policy's laws read of it: its name, its element's
 * kind, governor and version, and the address facts PostgreSQL generates from its lexical form
 * (`Attribute.dataScheme`, `dataToken` and `styleFetch`).
 */
const MediaAttribute = derived(
  "MediaAttribute",
  query(Qti).rule((r) => {
    const {
      dataScheme: usesData,
      dataToken,
      governor,
      id,
      kind,
      name,
      node,
      styleFetch,
      version,
    } = v(Attribute, "attribute");

    return r
      .match(Attribute, {
        dataScheme: usesData,
        dataToken,
        governor,
        id,
        kind,
        name,
        node,
        styleFetch,
        version,
      })
      .find({
        dataScheme: usesData,
        dataToken,
        governor,
        id,
        kind,
        name,
        node,
        styleFetch,
        version,
      });
  }),
);

/**
 * Every attribute no {@link Reference} is of, by its element and name, with its governor: Media
 * path holds each to be no fetched attribute, since the import writes a reference for every
 * attribute the reference census resolves.
 */
const UnreferencedAttribute = derived(
  "UnreferencedAttribute",
  query(Qti).rule((r) => {
    const { governor, name, node } = v(Attribute, "attribute");

    return r
      .match(Attribute, { governor, name, node })
      .where(r.not(Reference, { name, node }))
      .find({ governor, name, node });
  }),
);

/**
 * Every reference, by its element and name, with its kind, its outcome's scope and its lexical
 * form, which Media path reads.
 */
const MediaReference = derived(
  "MediaReference",
  query(Qti).rule((r) => {
    const { kind, lexical, name, node, scope } = v(Reference, "reference");

    return r
      .match(Reference, { kind, lexical, name, node, scope })
      .find({ kind, lexical, name, node, scope });
  }),
);

/**
 * Every text reference, by its element, with its kind and its outcome's scope.
 */
const MediaTextReference = derived(
  "MediaTextReference",
  query(Qti).rule((r) => {
    const { kind, node, scope } = v(TextReference, "reference");

    return r.match(TextReference, { kind, node, scope }).find({ kind, node, scope });
  }),
);

/**
 * Every node, by its id, with its kind, governor, version and string value, which Media path,
 * Media data and Media foreign read.
 */
const MediaNode = derived(
  "MediaNode",
  query(Qti).rule((r) => {
    const { governor, id, kind, stringValue, version } = v(Node, "node");

    return r
      .match(Node, { governor, id, kind, stringValue, version })
      .find({ governor, id, kind, stringValue, version });
  }),
);

/**
 * The resolved paths, by the reference's element and name, whose extension a {@link MediaType} row
 * lists: a path with an extension ({@link extensionPattern}) that ends with the row's suffix.
 */
const servedPaths = query(QtiMediaPolicy).rule((r) => {
  const { name, node, path } = v(ReferencePath, "path");
  const { suffix } = v(MediaType, "media");

  return (
    r
      .match(ReferencePath, { name, node, path })
      .match(MediaType, { suffix })
      .where(Compute.matches(path, extensionPattern))
      // GRIZZLE-PENDING: a boolean term as a predicate
      .where(Compute.eq(Compute.endsWith(path, suffix), true))
      .find({ name, node })
  );
});

/**
 * Every resolved path no {@link MediaType} row serves, by the reference's element and name, with
 * the reference's kind: Media type holds each to be no fetched reference's.
 */
const UnservedPath = derived(
  "UnservedPath",
  query(QtiMediaPolicy).rule((r) => {
    const { kind, name, node } = v(ReferencePath, "path");

    return r
      .match(ReferencePath, { kind, name, node })
      .where(r.not(servedPaths, { name, node }))
      .find({ kind, name, node });
  }),
);

/**
 * The resolved text paths, by the text reference's element, whose extension a {@link MediaType} row
 * lists.
 */
const servedTextPaths = query(QtiMediaPolicy).rule((r) => {
  const { node, path } = v(TextReferencePath, "path");
  const { suffix } = v(MediaType, "media");

  return r
    .match(TextReferencePath, { node, path })
    .match(MediaType, { suffix })
    .where(Compute.matches(path, extensionPattern))
    .where(Compute.eq(Compute.endsWith(path, suffix), true))
    .find({ node });
});

/**
 * Every resolved text path no {@link MediaType} row serves, by the text reference's element, with
 * its kind: Media type holds each to be no fetched text's.
 */
const UnservedTextPath = derived(
  "UnservedTextPath",
  query(QtiMediaPolicy).rule((r) => {
    const { kind, node } = v(TextReferencePath, "path");

    return r
      .match(TextReferencePath, { kind, node })
      .where(r.not(servedTextPaths, { node }))
      .find({ kind, node });
  }),
);

/**
 * The entries no document is at and no reference resolves to, by package and path. Each negation is
 * a filter of its own.
 */
const UnusedEntry = derived(
  "UnusedEntry",
  query(Qti).rule((r) => {
    const { package: pkg, path } = v(Entry, "entry");

    return r
      .match(Entry, { package: pkg, path })
      .where(r.not(Document, { package: pkg, path }))
      .where(r.not(ReferencePath, { package: pkg, path }))
      .where(r.not(TextReferencePath, { package: pkg, path }))
      .find({ package: pkg, path });
  }),
);

/**
 * The level's laws by name, the module's header giving each. Every check is named by its law with
 * spaces written as underscores, as every check of the schema is (`checkNameOf` of
 * `#pantry/import/refusal.ts`).
 */
export const mediaLawsByName = {
  "Entry used": [check("Entry_used", UnusedEntry, (u) => u.eq(u.path, manifestPath))],
  "Media data": [
    check("Media_data", MediaAttribute, (a) =>
      a.and(
        a.or(
          a.not(
            a.eq(
              Compute.subset(
                Compute.singleton(a.name),
                AttributeGrammar.row(AttributeModelOf.at("model", a.version, a.governor)),
              ),
              true,
            ),
          ),
          a.not(
            a.in(
              AttributeGrammar.at(
                "domain",
                AttributeModelOf.at("model", a.version, a.governor),
                a.name,
              ),
              uriDomains,
            ),
          ),
          a.eq(a.dataScheme, false),
        ),
        a.or(a.not(a.in(a.name, addressLists)), a.eq(a.dataToken, false)),
      ),
    ),
    check("Media_data", MediaNode, (n) =>
      n.or(
        n.not(
          n.and(
            TextDomain.has(n.version, n.governor),
            n.in(TextDomain.at("domain", n.version, n.governor), uriDomains),
          ),
        ),
        n.not(Compute.matches(n.stringValue, dataScheme)),
      ),
    ),
  ],
  "Media foreign": [
    check("Media_foreign", MediaAttribute, (a) => a.not(a.in(a.name, uninterpretedClasses))),
    check("Media_foreign", MediaNode, (n) => n.not(n.in(n.kind, Object.values(foreignKinds)))),
  ],
  "Media path": [
    check("Media_path", UnreferencedAttribute, (a) =>
      a.not(
        a.or(
          ...fetchedNames.map(({ governors, name }) =>
            a.and(a.eq(a.name, name), a.in(a.governor, governors)),
          ),
        ),
      ),
    ),
    check("Media_path", MediaReference, (r) =>
      r.or(
        r.not(
          r.or(
            ...fetchedAttributes.map(({ kind, name }) =>
              r.and(r.eq(r.kind, kind), r.eq(r.name, name)),
            ),
          ),
        ),
        r.and(r.eq(r.scope, "entry"), r.not(Compute.matches(r.lexical, nonRelative))),
      ),
    ),
    check("Media_path", MediaNode, (n) =>
      n.or(
        n.not(n.in(n.governor, textGovernors)),
        n.and(n.in(n.kind, resolvedTextKinds), n.not(Compute.matches(n.stringValue, nonRelative))),
      ),
    ),
    check("Media_path", MediaTextReference, (r) =>
      r.or(r.not(r.in(r.kind, fetchedTexts)), r.eq(r.scope, "entry")),
    ),
  ],
  "Media style": [
    check("Media_style", MediaAttribute, (a) =>
      a.or(a.not(a.eq(a.name, "style")), a.eq(a.styleFetch, false)),
    ),
  ],
  "Media type": [
    check("Media_type", UnservedPath, (p) =>
      p.not(
        p.or(
          ...fetchedAttributes.map(({ kind, name }) =>
            p.and(p.eq(p.kind, kind), p.eq(p.name, name)),
          ),
        ),
      ),
    ),
    check("Media_type", UnservedTextPath, (p) => p.not(p.in(p.kind, fetchedTexts))),
  ],
} as const;

/**
 * The package-media level over {@link QtiMediaPolicy}: every derived relation its laws read, and the
 * laws. An application lists it, or a level of its own over it, in its grizzle config's `schemas`,
 * so the installation holds `Qti`, the policy and these laws, and writes its policy as
 * {@link MediaType} rows.
 */
export const QtiMedia = schema.extend(
  QtiMediaPolicy,
  "QtiMedia",
  {
    MediaAttribute,
    MediaNode,
    MediaReference,
    MediaTextReference,
    UnreferencedAttribute,
    UnservedPath,
    UnservedTextPath,
    UnusedEntry,
  },
  Object.values(mediaLawsByName).flat(),
);
