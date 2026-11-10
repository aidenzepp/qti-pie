/**
 * The sections of the cached IMS specifications that law sources cite, and which of them each
 * specification marks normative, derived from its cached renderings in `~/.cache/gr8des/`, never
 * listed by hand: a hostile reader of a law's source looks first for a citation that rests on a
 * section the specification itself calls informative, or on an anchor no heading holds.
 *
 * Each specification states its normativity per section: a heading followed by "This Section is
 * NORMATIVE." or "This Section is NOT NORMATIVE." ("This Appendix is …" for an appendix), which its
 * subsections inherit until one restates it. The 3.0 information model marks §1, §2, §10 and
 * Appendix A not normative and §3 to §9 normative. The marks are read from both renderings each
 * specification is cached in, its HTML ({@link specSections}) and its text ({@link textMarks}), so
 * each is a check on the other; the HTML alone carries the heading anchors a source's URL names,
 * and its headings find the text's heading lines a line citation stands under.
 *
 * A source cites a section of a specification in three forms ({@link citationsOf}): a URL of the
 * specification, its fragment a heading's anchor, or an anchor inside a section, which belongs to
 * the heading before it; a `§` number inside the parenthetical that follows such a URL, up to a
 * nested URL; and a line of the specification's cached text, `info.txt:4656` (and `:N` after it,
 * `info.txt:74346 and :74420`), which stands in the section of the last heading at or before it
 * ({@link specSections}). A `§` a source writes anywhere else names no specification this module
 * can tell apart from the many others the sources cite (XML 1.0, RFC 3986, the plan), so an
 * information-model citation carries its URL or its line; nor is a line of a text this module does
 * not hold judged, such as Content Packaging 1.2's, whose sections state no normativity.
 */
import { Option } from "effect";

/**
 * A specification a law source may cite: the URL a citation of it starts with, and its cached
 * renderings under `~/.cache/gr8des/` with the SHA-256 of each as its sections were judged.
 */
export interface SpecDocument {
  /**
   * The cached HTML rendering, relative to `~/.cache/gr8des/`.
   */
  readonly html: string;
  /**
   * The SHA-256 of {@link SpecDocument.html}.
   */
  readonly htmlSha256: string;
  /**
   * The specification's name, for an offence's message.
   */
  readonly name: string;
  /**
   * The cached text rendering, relative to `~/.cache/gr8des/`.
   */
  readonly text: string;
  /**
   * The SHA-256 of {@link SpecDocument.text}.
   */
  readonly textSha256: string;
  /**
   * The URL every citation of the specification starts with, up to its fragment.
   */
  readonly url: string;
}

/**
 * The IMS specifications the law sources cite: the QTI 3.0 and 3.0.1 information models, the QTI
 * 3.0 XML binding, and the metadata and usage-data bindings.
 */
export const specDocuments: readonly SpecDocument[] = [
  {
    html: "anyuri-specs/qti/info.html",
    htmlSha256: "6cf0658f86de0731e28a35917bb088c866b3a6982f98c611e128ba419c1dbc5c",
    name: "the QTI 3.0 information model",
    text: "anyuri-specs/qti/info.txt",
    textSha256: "a3e8e38e19af9c865172553edec17d20a7b063493ebc15f075dc130834d4bf3c",
    url: "https://www.imsglobal.org/spec/qti/v3p0/info",
  },
  {
    html: "qti301/info301.html",
    htmlSha256: "dde409f5d4266480457edbad98e8cf6e1bc7c831ff6be2fbc348038642f0b3c6",
    name: "the QTI 3.0.1 information model",
    text: "qti301/info301.txt",
    textSha256: "bc654efa8bb0c9ceb54058f51cb0c0713740198b072c1db5f61924eb2a269a63",
    url: "https://www.imsglobal.org/sites/default/files/spec/qti/v3/info/imsqti_asi_v3p0p1_infomodel_v1p0.html",
  },
  {
    html: "anyuri-specs/qti/bind.html",
    htmlSha256: "2fd34e2f2fb3cc709d047a8f53aacdfce1d55517a8349aa88cbdafaed0d070cc",
    name: "the QTI 3.0 XML binding",
    text: "anyuri-specs/qti/bind.txt",
    textSha256: "6ae52db3f77e11553f2467ecc650381ebc6b0377ccbb8a4f92624834796e0c1f",
    url: "https://www.imsglobal.org/spec/qti/v3p0/bind",
  },
  {
    html: "qti-md-bind/index.html",
    htmlSha256: "540be500930b7cad7700775062ae09fff0a77160d245d0ba300f8287729a7c3a",
    name: "the QTI 3.0 metadata binding",
    text: "qti-md-bind/index.txt",
    textSha256: "616430681f3caf7647988ed75b2095f165da2988eb9fa6a647259cd8151afa3a",
    url: "https://www.imsglobal.org/sites/default/files/spec/qti/v3/md-bind/index.html",
  },
  {
    html: "pm-ud/ud-bind.html",
    htmlSha256: "6e5d9d9d3e832ff4e79bd80aab92fcbabbefafe08d7d2bc5c2d16975e570310d",
    name: "the QTI 3.0 usage data binding",
    text: "pm-ud/ud-bind.txt",
    textSha256: "3a993bee11e80f69e92d55b46d9ecfbe473c579466f7629702e5b2fb71b7a258",
    url: "https://www.imsglobal.org/sites/default/files/spec/qti/v3/ud-bind/index.html",
  },
];

/**
 * The URL every IMS specification's citation starts with: a citation of one that
 * {@link specDocuments} does not hold names a specification whose sections cannot be judged.
 */
export const imsUrl = "https://www.imsglobal.org/";

/**
 * A specification's sections as its renderings state them: the marks its headings carry, the
 * section each anchor of its HTML stands in, and the section each line of its text stands in.
 */
export interface Sections {
  /**
   * The normativity each numbered heading states for its section: `true` for "NORMATIVE", `false`
   * for "NOT NORMATIVE".
   */
  readonly marks: ReadonlyMap<string, boolean>;
  /**
   * Find the section an anchor stands in: its heading's, or the heading's before it.
   *
   * @param anchor - An anchor's name.
   * @returns The section's number, or none for an anchor the document does not hold, or one before
   *   its first numbered heading.
   */
  readonly sectionOf: (anchor: string) => Option.Option<string>;
  /**
   * Find the section a line of the text rendering stands in: the last numbered heading's at or
   * before it.
   *
   * @param line - The line's number, from 1.
   * @returns The section's number, or none for a line before the first heading of the body (the
   *   front matter and the table of contents) or past the text's end.
   */
  readonly sectionOfLine: (line: number) => Option.Option<string>;
}

/**
 * The statement of a section's normativity, as both renderings write it under its heading.
 */
const markPattern = /This (?:Section|Appendix|section) is (?<not>NOT )?NORMATIVE/u;

/**
 * Read a heading's section number from its text: `2.4.1`, a lettered appendix section `A1.2`, or
 * an appendix `Appendix A`, which is `A`.
 *
 * @param text - The heading's text, tags removed.
 * @returns The number, or none for a heading that numbers no section.
 */
export const sectionNumberOf = (text: string): Option.Option<string> => {
  const match =
    /^\s*(?:Appendix\s+(?<appendix>[A-Z])\b|(?<lettered>[A-Z]\d+(?:\.\d+)*)\.?(?:\s|$)|(?<numbered>\d+(?:\.\d+)*)\.?(?:\s|$))/u.exec(
      text,
    );

  return Option.fromNullishOr(
    match?.groups?.["appendix"] ?? match?.groups?.["lettered"] ?? match?.groups?.["numbered"],
  );
};

/**
 * The section a section number belongs to: `2.4` of `2.4.1`, `A1` of `A1.2`, `A` of `A1`, none of
 * a top-level section.
 *
 * @param section - The section number.
 * @returns Its parent's number, or none.
 */
const parentOf = (section: string): Option.Option<string> => {
  if (section.includes(".")) {
    return Option.some(section.slice(0, section.lastIndexOf(".")));
  }

  return /^[A-Z]\d+$/u.test(section) ? Option.some(section.slice(0, 1)) : Option.none();
};

/**
 * Decide a section's normativity: its own mark, else its nearest marked ancestor's.
 *
 * @param marks - The document's marks.
 * @param section - The section number.
 * @returns Whether it is normative, or none where neither it nor an ancestor is marked.
 */
export const normativityOf = (
  marks: ReadonlyMap<string, boolean>,
  section: string,
): Option.Option<boolean> =>
  Option.match(Option.fromNullishOr(marks.get(section)), {
    onNone: () => Option.flatMap(parentOf(section), (parent) => normativityOf(marks, parent)),
    onSome: Option.some,
  });

/**
 * Replace an HTML text's tags by spaces and decode the entities a heading writes.
 *
 * @param html - A fragment of HTML.
 * @returns Its text.
 */
const textOfHtml = (html: string): string =>
  html
    .replaceAll(/<[^>]*>/gu, " ")
    .replaceAll(/&nbsp;|&#160;/gu, " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"');

/**
 * A specification's sections as its HTML states them, with each numbered heading's text in
 * document order, by which its text rendering's heading lines are found.
 */
interface HtmlSections {
  /**
   * Each numbered heading, its section and its text with its whitespace collapsed.
   */
  readonly headings: readonly { readonly section: string; readonly title: string }[];
  /**
   * The marks, as {@link Sections.marks}.
   */
  readonly marks: ReadonlyMap<string, boolean>;
  /**
   * The anchors' sections, as {@link Sections.sectionOf}.
   */
  readonly sectionOf: (anchor: string) => Option.Option<string>;
}

/**
 * Collapse a line's runs of whitespace to single spaces and trim it, as a heading's text is
 * compared across the two renderings.
 *
 * @param text - The text.
 * @returns It collapsed.
 */
const collapsed = (text: string): string => text.replaceAll(/\s+/gu, " ").trim();

/**
 * Read a specification's sections from its HTML: every heading `<h1>` to `<h6>`, its section
 * number and the mark the text after it, up to the next heading, states; and every anchor, by the
 * `name` or `id` it is written with, at its place in the document.
 *
 * @param html - The cached HTML.
 * @returns The sections.
 */
const htmlSections = (html: string): HtmlSections => {
  const headings = [
    ...html.matchAll(/<h(?<level>[1-6])\b[^>]*>(?<inner>[\s\S]*?)<\/h\k<level>>/giu),
  ];
  const numbered = headings.flatMap((heading, at) => {
    const title = collapsed(textOfHtml(heading.groups?.["inner"] ?? ""));

    return Option.toArray(
      Option.map(sectionNumberOf(title), (section) => ({
        after: html.slice(
          heading.index + heading[0].length,
          headings[at + 1]?.index ?? html.length,
        ),
        section,
        start: heading.index,
        title,
      })),
    );
  });
  const marks = new Map(
    numbered.flatMap(({ after, section }) =>
      Option.toArray(
        Option.map(
          Option.fromNullishOr(markPattern.exec(textOfHtml(after))),
          (mark) => [section, mark.groups?.["not"] === undefined] as const,
        ),
      ),
    ),
  );
  const anchors = new Map<string, number>();
  for (const anchor of html.matchAll(/<[a-z][a-z0-9]*\s[^>]*?\b(?:name|id)="(?<name>[^"]+)"/giu)) {
    const name = anchor.groups?.["name"] ?? "";
    if (!anchors.has(name)) {
      anchors.set(name, anchor.index);
    }
  }

  return {
    headings: numbered.map(({ section, title }) => ({ section, title })),
    marks,
    sectionOf: (anchor) =>
      Option.fromNullishOr(anchors.get(anchor)).pipe(
        Option.flatMap((at) => Option.fromNullishOr(numbered.findLast(({ start }) => start <= at))),
        Option.map(({ section }) => section),
      ),
  };
};

/**
 * Read the marks a specification's text rendering states: each mark line, under the heading that
 * is the nearest line before it that holds any text.
 *
 * @param text - The cached text.
 * @returns Each marked section's normativity.
 */
export const textMarks = (text: string): ReadonlyMap<string, boolean> => {
  const lines = text.split("\n");

  return new Map(
    lines.flatMap((line, at) => {
      const mark = markPattern.exec(line.trim());
      if (mark === null || mark.index !== 0) {
        return [];
      }

      const heading = lines
        .slice(0, at)
        .findLast((before) => before.trim() !== "")
        ?.trim();

      return Option.toArray(
        Option.map(
          sectionNumberOf(heading ?? ""),
          (section) => [section, mark.groups?.["not"] === undefined] as const,
        ),
      );
    }),
  );
};

/**
 * Find each heading line of a specification's text rendering: each numbered heading of its HTML,
 * matched against the text's lines from the end, so a heading the table of contents repeats is
 * found where the body states it, and two headings of one text are found in their order.
 *
 * @param headings - The HTML's numbered headings, in document order.
 * @param lines - The text's lines, collapsed.
 * @returns Each found heading's line index and section, in order.
 */
const headingLines = (
  headings: HtmlSections["headings"],
  lines: readonly string[],
): readonly { readonly at: number; readonly section: string }[] => {
  const found: { readonly at: number; readonly section: string }[] = [];
  let before = lines.length;
  for (const { section, title } of headings.toReversed()) {
    const at = lines.slice(0, before).lastIndexOf(title);
    if (at !== -1) {
      found.unshift({ at, section });
      before = at;
    }
  }

  return found;
};

/**
 * Read a specification's sections from its two renderings: the marks and the anchors from its
 * HTML ({@link htmlSections}), and the section of each line of its text from the heading lines the
 * HTML's headings find in it.
 *
 * @param renderings - The cached HTML and text.
 * @returns The sections.
 */
export const specSections = (renderings: {
  readonly html: string;
  readonly text: string;
}): Sections => {
  const { headings, marks, sectionOf } = htmlSections(renderings.html);
  const lines = renderings.text.split("\n");
  const starts = headingLines(headings, lines.map(collapsed));

  return {
    marks,
    sectionOf,
    sectionOfLine: (line) =>
      line > lines.length
        ? Option.none()
        : Option.map(
            Option.fromNullishOr(starts.findLast(({ at }) => at <= line - 1)),
            ({ section }) => section,
          ),
  };
};

/**
 * One citation of a specification in a law's source: the document, the anchor its URL names, and
 * the `§` numbers the parenthetical after it cites; or a line of its text.
 */
export interface Citation {
  /**
   * The URL's fragment, none where the URL names the document alone.
   */
  readonly anchor: Option.Option<string>;
  /**
   * The specification.
   */
  readonly document: SpecDocument;
  /**
   * The line of the text rendering the citation names, none for a URL's citation.
   */
  readonly line: Option.Option<number>;
  /**
   * The `§` numbers of the parenthetical right after the URL, up to a nested URL.
   */
  readonly sections: readonly string[];
}

/**
 * Read the parenthetical that opens right after a position, spaces aside: up to its matching
 * close, or the text's end.
 *
 * @param text - The text.
 * @param at - The position after a URL.
 * @returns The parenthetical, or empty where none opens there.
 */
const parentheticalAt = (text: string, at: number): string => {
  const open = at + (/^ */u.exec(text.slice(at))?.[0].length ?? 0);
  if (text[open] !== "(") {
    return "";
  }

  let depth = 0;
  for (let end = open; end < text.length; end += 1) {
    if (text[end] === "(") {
      depth += 1;
    } else if (text[end] === ")") {
      depth -= 1;
    }

    if (depth === 0) {
      return text.slice(open, end + 1);
    }
  }

  return text.slice(open);
};

/**
 * A law source's citations of the IMS specifications.
 */
export interface Cited {
  /**
   * Each URL of a specification {@link specDocuments} holds, with its anchor and its `§` numbers,
   * and each line of its text.
   */
  readonly citations: readonly Citation[];
  /**
   * Each IMS URL of a specification it does not hold, which no section of can be judged.
   */
  readonly unknown: readonly string[];
}

/**
 * Read a law source's citations of the IMS specifications.
 *
 * @param source - The law's source.
 * @returns The citations, and the unjudgeable URLs.
 */
export const citationsOf = (source: string): Cited => {
  const urls = [...source.matchAll(/https?:\/\/[^\s'"(),;]+/gu)].map((url) => ({
    at: url.index,
    end: url.index + url[0].length,
    url: url[0].replace(/[.:]+$/u, ""),
  }));
  const citations = urls.flatMap(({ end, url }) => {
    const document = specDocuments.find(
      ({ url: base }) => url === base || url.startsWith(`${base}#`),
    );
    if (document === undefined) {
      return [];
    }

    const parenthetical = parentheticalAt(source, end);
    const nested = /https?:\/\//u.exec(parenthetical);
    const scope = nested === null ? parenthetical : parenthetical.slice(0, nested.index);

    return [
      {
        anchor: url.includes("#") ? Option.some(url.slice(url.indexOf("#") + 1)) : Option.none(),
        document,
        line: Option.none(),
        sections: [...scope.matchAll(/§\s?(?<section>[A-Z]?\d+(?:\.\d+)*)/gu)].map(
          (section) => section.groups?.["section"] ?? "",
        ),
      },
    ];
  });
  const lined = [
    ...source.matchAll(
      /(?<file>[\w.-]+\.txt):(?<first>\d+)(?<more>(?:(?:,\s*(?:and\s+)?|\s+and\s+):\d+)*)/gu,
    ),
  ].flatMap(({ groups }) => {
    const document = specDocuments.find(({ text }) => text.endsWith(`/${groups?.["file"] ?? ""}`));

    return document === undefined
      ? []
      : [
          groups?.["first"] ?? "",
          ...[...(groups?.["more"] ?? "").matchAll(/\d+/gu)].map(String),
        ].map((line) => ({
          anchor: Option.none(),
          document,
          line: Option.some(Number(line)),
          sections: [],
        }));
  });
  const unknown = urls
    .map(({ url }) => url)
    .filter(
      (url) =>
        url.startsWith(imsUrl) &&
        !specDocuments.some(({ url: base }) => url === base || url.startsWith(`${base}#`)),
    );

  return { citations: [...citations, ...lined], unknown };
};

/**
 * Decide whether a specification marks a section, or the section an ancestor of it is, not
 * normative.
 *
 * @param held - The specification's sections, none where its renderings were not read.
 * @param section - The section number.
 * @returns Whether it does; no where the section is normative or unmarked.
 */
const informative = (held: Sections | undefined, section: string): boolean =>
  held !== undefined &&
  Option.exists(normativityOf(held.marks, section), (normative) => !normative);

/**
 * Judge one citation: its anchor, or its line, stands in a heading's section, and neither that
 * section nor a `§` number of its parenthetical is one its specification marks not normative.
 *
 * @param law - The citing law.
 * @param citation - The citation.
 * @param held - The specification's sections.
 * @returns Its offences.
 */
const citationOffences = (
  law: string,
  { anchor, document, line, sections }: Citation,
  held: Sections | undefined,
): readonly string[] => {
  const text = document.text.slice(document.text.lastIndexOf("/") + 1);
  const lined = Option.isNone(line)
    ? []
    : Option.match(held === undefined ? Option.none() : held.sectionOfLine(line.value), {
        onNone: () => [`${law}: ${text}:${line.value} stands in no section of ${document.name}`],
        onSome: (section) =>
          informative(held, section)
            ? [
                `${law}: ${text}:${line.value} stands in §${section} of ${document.name}, which it marks NOT NORMATIVE`,
              ]
            : [],
      });
  const anchored = Option.isNone(anchor)
    ? []
    : Option.match(held === undefined ? Option.none() : held.sectionOf(anchor.value), {
        onNone: () => [`${law}: #${anchor.value} names no heading of ${document.name}`],
        onSome: (section) =>
          informative(held, section)
            ? [
                `${law}: #${anchor.value} stands in §${section} of ${document.name}, which it marks NOT NORMATIVE`,
              ]
            : [],
      });

  return [
    ...anchored,
    ...lined,
    ...sections
      .filter((section) => informative(held, section))
      .map((section) => `${law}: §${section} of ${document.name}, which it marks NOT NORMATIVE`),
  ];
};

/**
 * Judge law sources against the specifications' sections: every citation's anchor and line stands
 * in a heading's section, no cited section is one its specification marks not normative, and no
 * IMS URL names a specification whose sections cannot be read.
 *
 * @param sources - Each law's source, by law.
 * @param sections - Each specification's sections, by its URL.
 * @returns Each offence, as `law: what it cites, and why it cannot carry a law`.
 */
export const offencesOf = (
  sources: ReadonlyMap<string, string>,
  sections: ReadonlyMap<string, Sections>,
): readonly string[] =>
  [...sources].flatMap(([law, source]) => {
    const { citations, unknown } = citationsOf(source);

    return [
      ...unknown.map((url) => `${law}: ${url} is no specification whose sections can be judged`),
      ...citations.flatMap((citation) =>
        citationOffences(law, citation, sections.get(citation.document.url)),
      ),
    ];
  });
