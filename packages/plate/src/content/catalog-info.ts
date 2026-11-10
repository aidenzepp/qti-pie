/**
 * Catalog Resources (I-14): the item's `qti-catalog-info`, read into the item model as written,
 * resolved under the supports a host enables, and listed after the item body (issue m3e-04).
 *
 * A catalog is dormant alternative content outside the body. The item root's walk dispatches the
 * element to {@link catalogInfoModule}'s `parse`, which reads every catalog, card, entry and file
 * href as written, and takes the body's `data-catalog-idref` references from its context, since
 * the body walk collects them and drops the attribute from each element. The resolution is the
 * module's `redact`, a function of the item and the supports alone, in the information model's
 * steps:
 *
 * 1. Supports: `Supports.catalog` names each enabled support, predefined or `ext:`.
 * 2. Reference: a catalog that no element of the body names by `data-catalog-idref` is dropped.
 * 3. Card: for each enabled support, the catalog's card with that `support` (one at most; `open`
 *    refuses a second).
 * 4. Direct content: a card with no entries gives its `qti-html-content` and its `qti-file-href`s.
 * 5. Entry selection: a card with entries gives the entry whose parameter matches the candidate's, for
 *    the four supports `Supports` carries a parameter for: `keyword-translation`, the entry's
 *    `xml:lang` against `keywordTranslationLanguage`; `sign-language`, its `xml:lang` against
 *    `signLanguage`; `spoken`, its `data-reading-type` against `readAloud`; `braille`, its
 *    `data-braille-type` against `braille`'s `brailleType`. A match is equality of the collapsed
 *    values, and a field that is none matches no entry. Every other support carries no parameter,
 *    so no entry matches and step 6 decides.
 * 6. Default: with no matching entry, the entry marked `default="true"`. With no default either, the
 *    sources stop, and plate's default is that the card gives nothing.
 * 7. File choice: among several `qti-file-href`, each is listed as a link with its `mime-type`; none
 *    is picked, since no reading says which.
 * 8. Presentation: the sources stop at each support's own row, and plate's default is the listing
 *    {@link catalogInfoModule}'s `render` writes after the body; a support whose presenter has
 *    landed ({@link Presenters}) is handed its card instead, and each support's presentation beside
 *    its referencing element is that presenter's issue.
 * 9. Dormant otherwise: a card of a support the host did not enable, an entry not chosen and a catalog
 *    no reference names are in neither the HTML nor the redacted copy, withheld through the
 *    redaction kit.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { RedactedJson } from "#plate/codec/redacted.ts";
import type {
  CatalogPresenter,
  CatalogReference,
  ContentRedactKit,
  ContentRenderKit,
  ItemContentModule,
} from "#plate/content/contract.ts";
import { presenters } from "#plate/content/presenters/table.ts";
import type { Presenters } from "#plate/content/presenters/table.ts";
import { qtiNamespace } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import type { ReaderKit } from "#plate/interactions/contract.ts";
import type { BodyAttribute, BodyNode } from "#plate/model/item.ts";
import { classifyUrl, formatUrl } from "#plate/model/url.ts";
import { trimXmlSpace } from "#plate/model/values.ts";
import type { EmitState, PayloadNode } from "#plate/payload.ts";
import { catalogSupports } from "#plate/supports.ts";
import type { CatalogSupport, ExtensionSupport, Supports } from "#plate/supports.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * The QTI element Catalog Resources is read from.
 */
const element = "qti-catalog-info";

/**
 * One `qti-file-href` of a card or an entry: the file's href as written, a path in the package,
 * and its required `mime-type`. The listing writes each as a link; no reading says which of
 * several a delivery picks, so plate picks none (step 7).
 */
export interface CatalogFile {
  readonly href: string;
  readonly mimeType: string;
}

/**
 * One `qti-card-entry` as written: its content, whether it designates itself the card's default,
 * its files, its `xml:lang`, and its other attributes in no namespace (the `data-*` parameters a
 * candidate's PNP aligns with), each as written. Only the chosen entry's content reaches the page.
 *
 * The module reads the element `check` secured: that step removes each attribute the XSD's
 * wildcard alone admits, but keeps a `qti-card-entry`'s `data-*` parameters as written
 * (`isDataParameter` in `#plate/validate/verdict.ts`), so `attributes` holds `data-reading-type`
 * and `data-braille-type` for steps 5's `spoken` and `braille` matches to read.
 */
export interface CatalogEntryNode {
  readonly attributes: readonly BodyAttribute[];
  readonly content: readonly BodyNode[];
  readonly default: boolean;
  readonly files: readonly CatalogFile[];
  readonly lang: Option.Option<string>;
}

/**
 * One `qti-card` of the item model: its `support` as written, its `xml:lang`, and either its
 * direct content and files (a card with no entries) or its entries. After `redact` a kept card is
 * the active card: pruned to the chosen entry's content and files, with no entries left.
 */
export interface CatalogCardNode {
  readonly content: readonly BodyNode[];
  readonly entries: readonly CatalogEntryNode[];
  readonly files: readonly CatalogFile[];
  readonly lang: Option.Option<string>;
  readonly support: string;
}

/**
 * One `qti-catalog` of the item model: its `id` as written and its cards in document order.
 */
export interface CatalogNode {
  readonly cards: readonly CatalogCardNode[];
  readonly id: string;
}

/**
 * The model node of `qti-catalog-info`: the catalogs as read, and the body's references to them
 * as the item root's walk handed them. After `redact` it holds only the catalogs a reference names
 * that keep an active card, each with its active cards alone.
 */
export interface CatalogInfoNode {
  readonly catalogs: readonly CatalogNode[];
  readonly references: readonly CatalogReference[];
}

/**
 * An active card as the page sees it, and as a landed presenter ({@link CatalogPresenter}) is
 * handed it: the card's `support` as written, the chosen content copied into payload nodes, its
 * files, and the language of what it shows, the chosen entry's `xml:lang` when it has one and the
 * card's otherwise. A presenter that lands declares itself over this type.
 */
export interface CatalogCard {
  readonly content: readonly PayloadNode[];
  readonly files: readonly CatalogFile[];
  readonly lang: Option.Option<string>;
  readonly support: string;
}

/**
 * One kept catalog as the page sees it: its `id`, its active cards in document order, and how many
 * elements of the body referenced it.
 */
export interface CatalogPayload {
  readonly cards: readonly CatalogCard[];
  readonly id: string;
  readonly references: number;
}

/**
 * The payload node of `qti-catalog-info`: the kept catalogs as the page sees them.
 */
export interface CatalogInfoPayload {
  readonly catalogs: readonly CatalogPayload[];
}

/**
 * The JSON form of body nodes in a redacted item, as the codec's body schema encodes them: the
 * form the kit's `BodyNodes` schema gives, named here by type alone, so this module value-imports
 * no Schema.
 */
type BodyNodesJson = RedactedJson["body"];

/**
 * The JSON form of {@link CatalogFile}.
 */
export interface CatalogFileJson {
  readonly href: string;
  readonly mimeType: string;
}

/**
 * The JSON form of {@link CatalogEntryNode}: its `lang` an optional key, absent when none.
 */
export interface CatalogEntryJson {
  readonly attributes: readonly BodyAttribute[];
  readonly content: BodyNodesJson;
  readonly default: boolean;
  readonly files: readonly CatalogFileJson[];
  readonly lang?: string;
}

/**
 * The JSON form of {@link CatalogCardNode}.
 */
export interface CatalogCardJson {
  readonly content: BodyNodesJson;
  readonly entries: readonly CatalogEntryJson[];
  readonly files: readonly CatalogFileJson[];
  readonly lang?: string;
  readonly support: string;
}

/**
 * The JSON form of {@link CatalogNode}.
 */
export interface CatalogJson {
  readonly cards: readonly CatalogCardJson[];
  readonly id: string;
}

/**
 * The JSON form of {@link CatalogInfoNode}: a reference holds its `idref` and no path, as no body
 * node of the JSON form holds one, so a page learns which catalogs the body names and how often,
 * and nothing of where.
 */
export interface CatalogInfoJson {
  readonly catalogs: readonly CatalogJson[];
  readonly references: readonly { readonly idref: string }[];
}

/**
 * A presenter whose card type is this module's: what a presenter declares once it lands.
 */
type LandedPresenter = CatalogPresenter<CatalogSupport, CatalogCard>;

/**
 * A run of XML whitespace, as XSD's `whiteSpace="collapse"` replaces it by one space.
 */
const xmlWhitespaceRun = /[\t\n\r ]+/gu;

/**
 * Collapse a value's XML whitespace, as XSD's `whiteSpace="collapse"` does: each run becomes one
 * space, and a space at either end is removed. A `support`, an `id`, an `idref` and each matched
 * parameter compare by their collapsed values, as `open` compares a `support` (R9-a).
 *
 * @param value The value as written.
 * @returns The collapsed value.
 */
const collapse = (value: string): string => trimXmlSpace(value).replaceAll(xmlWhitespaceRun, " ");

/**
 * Read an element's `xml:lang` as written.
 *
 * @param read The reader kit.
 * @param source The element.
 * @returns The language, none when the element writes none.
 */
const langOf = (read: ReaderKit, source: SourceElement): Option.Option<string> =>
  read.valueOf(source, "xml:lang");

/**
 * Read the `qti-file-href` children of a card or an entry.
 *
 * @param read The reader kit.
 * @param parent The card or entry.
 * @returns The files in document order, or the refusal of one without its `mime-type`.
 */
const filesOf = (
  read: ReaderKit,
  parent: SourceElement,
): Result.Result<readonly CatalogFile[], Refusal> =>
  Result.all(
    read.childrenNamed(parent, "qti-file-href").map((file) =>
      Result.map(read.requiredValue(file, "mime-type"), (mimeType) => ({
        href: read.textOf(file),
        mimeType,
      })),
    ),
  );

/**
 * Read the content of a card's or an entry's first `qti-html-content`, as the body walk reads body
 * nodes: HTML as elements, MathML and any `qti-*` element as the notice the body walk gives it.
 *
 * @param read The reader kit.
 * @param parent The card or entry.
 * @returns The content, empty when the parent holds no `qti-html-content`, or a refusal.
 */
const contentOf = (
  read: ReaderKit,
  parent: SourceElement,
): Result.Result<readonly BodyNode[], Refusal> => {
  const [html] = read.childrenNamed(parent, "qti-html-content");

  return html === undefined ? Result.succeed([]) : read.nodes(html);
};

/**
 * Read one `qti-card-entry`.
 *
 * @param read The reader kit.
 * @param entry The entry.
 * @returns The entry node, or a refusal.
 */
const entryOf = (read: ReaderKit, entry: SourceElement): Result.Result<CatalogEntryNode, Refusal> =>
  Result.gen(function* readEntry() {
    const isDefault = yield* read.xsBoolean(entry, "default", false);
    const content = yield* contentOf(read, entry);
    const files = yield* filesOf(read, entry);

    return {
      attributes: entry.attributes
        .filter((attribute) => attribute.namespace === "" && attribute.local !== "default")
        .map((attribute) => ({ name: attribute.local, value: attribute.value })),
      content,
      default: isDefault,
      files,
      lang: langOf(read, entry),
    };
  });

/**
 * Read one `qti-card`.
 *
 * @param read The reader kit.
 * @param card The card.
 * @returns The card node, or a refusal.
 */
const cardOf = (read: ReaderKit, card: SourceElement): Result.Result<CatalogCardNode, Refusal> =>
  Result.gen(function* readCard() {
    const support = yield* read.requiredValue(card, "support");
    const content = yield* contentOf(read, card);
    const files = yield* filesOf(read, card);
    const entries = yield* Result.all(
      read.childrenNamed(card, "qti-card-entry").map((entry) => entryOf(read, entry)),
    );

    return { content, entries, files, lang: langOf(read, card), support };
  });

/**
 * Read one `qti-catalog`.
 *
 * @param read The reader kit.
 * @param catalog The catalog.
 * @returns The catalog node, or a refusal.
 */
const catalogOf = (read: ReaderKit, catalog: SourceElement): Result.Result<CatalogNode, Refusal> =>
  Result.gen(function* readCatalog() {
    const id = yield* read.requiredValue(catalog, "id");
    const cards = yield* Result.all(
      read.childrenNamed(catalog, "qti-card").map((card) => cardOf(read, card)),
    );

    return { cards, id };
  });

/**
 * Tell whether a support name is one of the predefined vocabulary, so the presenter table has a
 * row for it; an `ext:` support has none.
 *
 * @param support The collapsed support name.
 * @returns Whether the table holds it.
 */
const isPredefined = (support: string): support is CatalogSupport =>
  catalogSupports.some((name) => name === support);

/**
 * Tell whether a support name is one a host can enable: predefined, or an `ext:` extension. A
 * card whose `support` is neither (which the XSD refuses first) is enabled by no host.
 *
 * @param support The collapsed support name.
 * @returns Whether `Supports.catalog` can hold it.
 */
const isSupportName = (support: string): support is CatalogSupport | ExtensionSupport =>
  isPredefined(support) || support.startsWith("ext:");

/**
 * Tell whether the host enabled a card's support (step 1).
 *
 * @param supports The supports the host enabled.
 * @param support The card's `support` as written.
 * @returns Whether the card's collapsed support is among the enabled.
 */
const isEnabled = (supports: Supports, support: string): boolean => {
  const name = collapse(support);

  return isSupportName(name) && supports.catalog.has(name);
};

/**
 * Tell whether a presenter has landed: its `implemented` is true, and then its card type is this
 * module's {@link CatalogCard}, since a stub's `present` is typed over `never` precisely because it
 * presents no card, and a presenter that lands declares itself over the card the module gives.
 *
 * @param presenter The presenter of a predefined support.
 * @returns Whether it presents the card.
 */
const hasLanded = (presenter: CatalogPresenter<CatalogSupport>): presenter is LandedPresenter =>
  presenter.implemented;

/**
 * Find the landed presenter of a card's support, none for an `ext:` support or a stub.
 *
 * @param support The card's collapsed support.
 * @returns The presenter to hand the card to.
 */
const presenterOf = (support: string): Option.Option<LandedPresenter> =>
  isPredefined(support)
    ? Option.filter(Option.some(presenters[support]), hasLanded)
    : Option.none();

/**
 * Read one entry attribute, collapsed, none when the entry writes none.
 *
 * @param entry The entry.
 * @param name The attribute's name.
 * @returns The collapsed value.
 */
const parameterOf = (entry: CatalogEntryNode, name: string): Option.Option<string> =>
  Option.map(
    Option.fromUndefinedOr(entry.attributes.find((attribute) => attribute.name === name)),
    ({ value }) => collapse(value),
  );

/**
 * The parameter of one support a card entry is chosen by (step 5): where the candidate's value
 * sits in the supports, and where an entry writes its own.
 */
interface Parameter {
  /**
   * Read the candidate's value from the supports, none when the field is none, which matches no
   * entry.
   *
   * @param supports The supports the host enabled.
   * @returns The candidate's value as the host wrote it.
   */
  readonly candidate: (supports: Supports) => Option.Option<string>;
  /**
   * Read the value an entry writes for the parameter, none when the entry writes none.
   *
   * @param entry The entry.
   * @returns The value as written.
   */
  readonly written: (entry: CatalogEntryNode) => Option.Option<string>;
}

/**
 * Read an entry's `xml:lang`, the parameter of the two language supports.
 *
 * @param entry The entry.
 * @returns The language as written.
 */
const writtenLang = (entry: CatalogEntryNode): Option.Option<string> => entry.lang;

/**
 * The four supports `Supports` carries a parameter for, by collapsed support name: a card of any
 * other support matches no entry, and its default alone decides (step 6).
 */
const parameters: ReadonlyMap<string, Parameter> = new Map<string, Parameter>([
  [
    "braille",
    {
      candidate: (supports) =>
        supports.braille.pipe(Option.flatMap((braille) => braille.brailleType)),
      written: (entry) => parameterOf(entry, "data-braille-type"),
    },
  ],
  [
    "keyword-translation",
    { candidate: (supports) => supports.keywordTranslationLanguage, written: writtenLang },
  ],
  ["sign-language", { candidate: (supports) => supports.signLanguage, written: writtenLang }],
  [
    "spoken",
    {
      candidate: (supports) => supports.readAloud,
      written: (entry) => parameterOf(entry, "data-reading-type"),
    },
  ],
]);

/**
 * Find the entry whose parameter equals the candidate's (step 5), the collapsed values compared.
 *
 * @param card The card, which has entries.
 * @param supports The supports the host enabled.
 * @returns The first matching entry, none when the support carries no parameter, the candidate
 *   set none, or no entry writes the candidate's value.
 */
const matchingEntry = (
  card: CatalogCardNode,
  supports: Supports,
): Option.Option<CatalogEntryNode> =>
  Option.fromUndefinedOr(parameters.get(collapse(card.support))).pipe(
    Option.flatMap((parameter) =>
      parameter.candidate(supports).pipe(
        Option.map(collapse),
        Option.flatMap((value) =>
          Option.fromUndefinedOr(
            card.entries.find((entry) =>
              parameter
                .written(entry)
                .pipe(Option.exists((written) => collapse(written) === value)),
            ),
          ),
        ),
      ),
    ),
  );

/**
 * Choose the entry a card with entries gives (steps 5 and 6): the one whose parameter matches the
 * candidate's, else the one marked default, else none, so the card gives nothing.
 *
 * @param card The card, which has entries.
 * @param supports The supports the host enabled.
 * @returns The chosen entry.
 */
const chosenEntry = (card: CatalogCardNode, supports: Supports): Option.Option<CatalogEntryNode> =>
  matchingEntry(card, supports).pipe(
    Option.orElse(() => Option.fromUndefinedOr(card.entries.find((entry) => entry.default))),
  );

/**
 * Every body node a card holds, its direct content and each entry's: what the redaction withholds
 * when the card stays dormant.
 *
 * @param card The card.
 * @returns Its content.
 */
const allContentOf = (card: CatalogCardNode): readonly BodyNode[] => [
  ...card.content,
  ...card.entries.flatMap((entry) => entry.content),
];

/**
 * What a card shows once its entry is chosen: the card itself for a card with no entries, or the
 * chosen entry's content and files, with the entry's language when it names one and the card's
 * otherwise.
 */
type Shown = Pick<CatalogCardNode, "content" | "files" | "lang">;

/**
 * Tell whether a card shows nothing: no content and no file, as the XSD admits an empty card, which
 * the reading admits ("A card holds an HTML content node, file hrefs, both, or nothing") and plate
 * neither lists nor copies.
 *
 * @param shown What the card shows.
 * @returns Whether it is empty.
 */
const isEmpty = (shown: Shown): boolean => shown.content.length === 0 && shown.files.length === 0;

/**
 * Resolve one card under the supports (steps 3 to 6): the active card, pruned to what it shows,
 * or none for a card the host did not enable, one that chooses no entry, or one that shows nothing
 * (no content and no file). The content of what is not shown is handed to the kit's `withhold`, and
 * the shown content is walked through its `nodes`.
 *
 * @param card The card as read.
 * @param kit The redaction kit.
 * @returns The active card, or none.
 */
const activeCard = (
  card: CatalogCardNode,
  kit: ContentRedactKit,
): Option.Option<CatalogCardNode> => {
  if (!isEnabled(kit.supports, card.support)) {
    kit.withhold(allContentOf(card));

    return Option.none();
  }

  const chosen = card.entries.length === 0 ? Option.none() : chosenEntry(card, kit.supports);
  const shown: Shown = Option.match(chosen, {
    onNone: () => card,
    onSome: (entry) => ({
      content: entry.content,
      files: entry.files,
      lang: Option.orElse(entry.lang, () => card.lang),
    }),
  });
  // A card with entries holds no direct content, and an entry not chosen stays dormant.
  if (Option.isSome(chosen)) {
    kit.withhold(card.content);
  }

  for (const entry of card.entries) {
    if (!Option.contains(chosen, entry)) {
      kit.withhold(entry.content);
    }
  }

  if ((card.entries.length > 0 && Option.isNone(chosen)) || isEmpty(shown)) {
    kit.withhold(shown.content);

    return Option.none();
  }

  return Option.some({
    content: kit.nodes(shown.content),
    entries: [],
    files: shown.files,
    lang: shown.lang,
    support: card.support,
  });
};

/**
 * Count the body's references to a catalog: each `data-catalog-idref` whose collapsed token is the
 * catalog's collapsed `id`.
 *
 * @param node The model node.
 * @param catalog The catalog.
 * @returns The count.
 */
const referencesTo = (node: CatalogInfoNode, catalog: CatalogNode): number => {
  const id = collapse(catalog.id);

  return node.references.filter((reference) => collapse(reference.idref) === id).length;
};

/**
 * Write one file href as a link: its text the href as written, its `href` the path resolved
 * against the asset base as the emitter resolves a body `a`'s, and its `type` the `mime-type`. A
 * value `url.ts` drops (one that leaves the package, or an unparsable one) is written with no
 * `href`, as the emitter writes a body link whose URL was dropped, so the text alone names the
 * file.
 *
 * @param file The file.
 * @param state The emit state, which gives the asset base.
 * @returns The link.
 */
const fileLink = (file: CatalogFile, state: EmitState): Element => {
  const url = classifyUrl("link", file.href);
  const href: Attributes = url.kind === "dropped" ? {} : { href: formatUrl(url, state.assetBase) };

  return h("a", { ...href, type: file.mimeType }, [text(file.href)]);
};

/**
 * Write one active card as a list item: `data-support` the card's `support` as written, `lang` the
 * language of what it shows when it names one, and either what the support's landed presenter
 * gives or the card's content followed by one link per file.
 *
 * @param card The active card.
 * @param state The emit state.
 * @param kit The render kit.
 * @returns The list item, or the refusal of a part swap.
 */
const cardItem = (
  card: CatalogCard,
  state: EmitState,
  kit: ContentRenderKit,
): Result.Result<Element, PartSwapRefused> =>
  Result.map(
    Option.match(presenterOf(collapse(card.support)), {
      onNone: () =>
        Result.map(kit.nodes(card.content), (content): readonly Node[] => [
          ...content,
          ...card.files.map((file) => fileLink(file, state)),
        ]),
      onSome: (presenter) => presenter.present(card, state, kit),
    }),
    (children) =>
      h(
        "li",
        {
          "data-support": card.support,
          ...Option.match(card.lang, { onNone: () => ({}), onSome: (lang) => ({ lang }) }),
        },
        children,
      ),
  );

/**
 * Write one kept catalog as a list: `data-catalog` its `id`, `data-references` how many elements
 * of the body named it, and one item per active card in document order.
 *
 * @param catalog The catalog.
 * @param state The emit state.
 * @param kit The render kit.
 * @returns The list, or the refusal of a part swap.
 */
const catalogList = (
  catalog: CatalogPayload,
  state: EmitState,
  kit: ContentRenderKit,
): Result.Result<Element, PartSwapRefused> =>
  Result.map(Result.all(catalog.cards.map((card) => cardItem(card, state, kit))), (items) =>
    h("ul", { "data-catalog": catalog.id, "data-references": String(catalog.references) }, items),
  );

/**
 * The Catalog Resources module (I-14), landed by issue m3e-04: it reads the item's catalogs, keeps
 * the active cards under the enabled supports, and lists them after the body, each support's card
 * through its presenter once that has landed. The resolution steps and plate's defaults where the
 * sources stop are stated at the module's head.
 */
export const catalogInfoModule: ItemContentModule<
  typeof element,
  CatalogInfoNode,
  CatalogInfoPayload,
  CatalogInfoJson
> & {
  /**
   * The presenter of each predefined catalog support, which the module hands an active card to
   * when the presenter has landed; an `ext:` support has none and is always listed.
   */
  readonly presenters: Presenters;
} = {
  /**
   * The content the listing writes: every active card's content, in order, so the heading shift
   * counts a heading inside a card.
   */
  content: (payload) =>
    payload.catalogs.flatMap((catalog) => catalog.cards.flatMap((card) => card.content)),
  /**
   * Copy the kept catalogs for the page: each active card's content through the kit, and each
   * catalog's reference count in place of the references.
   */
  copy: (node, kit) => ({
    catalogs: node.catalogs.map((catalog) => ({
      cards: catalog.cards.map((card) => ({
        content: kit.nodes(card.content),
        files: card.files,
        lang: card.lang,
        support: card.support,
      })),
      id: catalog.id,
      references: referencesTo(node, catalog),
    })),
  }),
  element,
  feature: ["I-14"],
  implemented: true,
  namespace: qtiNamespace,
  /**
   * Read the element's catalogs as written, and take the body's references from the context. The
   * references are copied first, so a `data-catalog-idref` inside card content, which the body
   * walk also collects, counts as no reference of the body.
   */
  parse: (source, context) => {
    const references = [...context.catalogReferences];

    return Result.map(
      Result.all(
        context.read
          .childrenNamed(source, "qti-catalog")
          .map((catalog) => catalogOf(context.read, catalog)),
      ),
      (catalogs) => Option.some({ catalogs, references }),
    );
  },
  /**
   * The node's codec: its catalogs with each card's content through the body's schema, and each
   * reference's `idref` alone, its path omitted on encoding and `""` on decoding
   * ({@link CatalogInfoJson}).
   */
  payloadSchema: ({ BodyNodes, NoPath, OptionalText, Schema }) => {
    const File = Schema.Struct({ href: Schema.String, mimeType: Schema.String });

    return Schema.Struct({
      catalogs: Schema.Array(
        Schema.Struct({
          cards: Schema.Array(
            Schema.Struct({
              content: BodyNodes,
              entries: Schema.Array(
                Schema.Struct({
                  attributes: Schema.Array(
                    Schema.Struct({ name: Schema.String, value: Schema.String }),
                  ),
                  content: BodyNodes,
                  default: Schema.Boolean,
                  files: Schema.Array(File),
                  lang: OptionalText,
                }),
              ),
              files: Schema.Array(File),
              lang: OptionalText,
              support: Schema.String,
            }),
          ),
          id: Schema.String,
        }),
      ),
      references: Schema.Array(Schema.Struct({ idref: Schema.String, path: NoPath })),
    });
  },
  placement: "item",
  presenters,
  /**
   * Resolve the catalogs under the kit's supports: per catalog a reference names, the active cards
   * alone ({@link activeCard}); a catalog no reference names, or that keeps no card, is dropped
   * with its content withheld; a node that keeps no catalog gives none.
   */
  redact: (node, kit) => {
    const catalogs = node.catalogs.flatMap((catalog) => {
      if (referencesTo(node, catalog) === 0) {
        for (const card of catalog.cards) {
          kit.withhold(allContentOf(card));
        }

        return [];
      }

      const cards = catalog.cards.flatMap((card) => Option.toArray(activeCard(card, kit)));

      return cards.length === 0 ? [] : [{ cards, id: catalog.id }];
    });

    return catalogs.length === 0 ? Option.none() : Option.some({ ...node, catalogs });
  },
  /**
   * Write the listing: one element holding one list per kept catalog, since the contract gives one
   * element per node ({@link catalogList}).
   */
  render: (payload, state, kit) =>
    Result.map(
      Result.all(payload.catalogs.map((catalog) => catalogList(catalog, state, kit))),
      (lists) => h("div", {}, lists),
    ),
};
