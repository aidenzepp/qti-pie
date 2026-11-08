/**
 * The site generator (lane NIL, the SitePath fix; spec readings 114 and 115): the every-relation
 * package (`#pantry/test/gen/every-relation.ts`) with each of its three sites drawn by name, so the
 * box exhausts every way a site's href can stand: the item body's include of `fragment.xml`, the
 * response processing's include of `rules.xml`, and the test's section ref of `section.xml`.
 *
 * Each site writes its href as the package writes it (`listed`, a document the manifest lists),
 * names a file the package does not hold (`absent`), names an entry the package holds but lists as
 * no document (`unlisted`, the package's image), names a file outside the package (`external`), or
 * writes no href (`missing`). XInclude lets an include write none (§3.1, its href "absent when
 * parse="xml""), and it names no document then; a section ref must write one. Every other entry
 * of the package stands as written, so the only laws a case can break are the sites' own, the
 * required href's and the absent file's.
 */
import { element } from "@grizzle/testing/gen";
import { Option } from "effect";
import type { Gen } from "@grizzle/testing/gen";
import { everyRelationPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";

/**
 * How a site writes its href: as the package writes it, naming a file the package does not hold,
 * naming an entry it lists as no document, naming a file outside the package, or not at all.
 */
export const hrefCases = ["listed", "absent", "unlisted", "external", "missing"] as const;

/**
 * One of {@link hrefCases}.
 */
export type HrefCase = (typeof hrefCases)[number];

/**
 * A package of the site box: how each of its three sites writes its href.
 */
export interface SiteBox {
  readonly fragment: HrefCase;
  readonly rules: HrefCase;
  readonly section: HrefCase;
}

/**
 * The names of the box's three sites, each the field of {@link SiteBox} that draws it.
 */
export const siteNames = ["fragment", "rules", "section"] as const;

/**
 * One of {@link siteNames}.
 */
export type SiteName = (typeof siteNames)[number];

/**
 * Where each site is written: its document's path, its element as the package writes it, its href
 * there, so an edit can replace the one passage, and the href of the package's image from there,
 * an entry the manifest lists as no document.
 */
export const sites: Readonly<
  Record<
    SiteName,
    {
      readonly href: string;
      readonly image: string;
      readonly kind: string;
      readonly path: string;
    }
  >
> = {
  fragment: {
    href: "fragment.xml",
    image: "media/pic.png",
    kind: "xi:include",
    path: "items/item2.xml",
  },
  rules: { href: "rules.xml", image: "media/pic.png", kind: "xi:include", path: "items/item3.xml" },
  section: {
    href: "section.xml",
    image: "items/media/pic.png",
    kind: "qti-assessment-section-ref",
    path: "test.xml",
  },
};

/**
 * The href an `absent` site writes: a path beside its document that no entry holds.
 */
export const absentHref = "absent.xml";

/**
 * The href an `external` site writes: a file outside the package.
 */
export const externalHref = "https://example.com/external.xml";

/**
 * Every package of the site box, each site under each of its cases: 125 in all, so one exhaustion
 * covers the space.
 */
export const siteBox: Gen<SiteBox> = (source) => ({
  fragment: source.draw(element(hrefCases)),
  rules: source.draw(element(hrefCases)),
  section: source.draw(element(hrefCases)),
});

/**
 * Write a package of the box as one line.
 *
 * @param box - The package.
 * @returns Its literal.
 */
export const siteLiteral = (box: SiteBox): string =>
  siteNames.map((name) => `${name}=${box[name]}`).join(" ");

/**
 * Replace a site's href passage in its document: as written, naming {@link absentHref}, the
 * package's image, or {@link externalHref}, or gone.
 *
 * @param text - The document.
 * @param name - The site.
 * @param href - The case.
 * @returns The edited document.
 */
const withHref = (text: string, name: SiteName, href: HrefCase): string => {
  const passage = ` href="${sites[name].href}"`;
  if (!text.includes(passage)) {
    throw new Error(
      `The every-relation package no longer writes ${passage} in ${sites[name].path}. Point the site generator's sites at the package's own hrefs.`,
    );
  }

  const written: Readonly<Record<HrefCase, string>> = {
    absent: ` href="${absentHref}"`,
    external: ` href="${externalHref}"`,
    listed: passage,
    missing: "",
    unlisted: ` href="${sites[name].image}"`,
  };

  return text.replace(passage, written[href]);
};

/**
 * Build a package of the box: the every-relation package of two choices, one hotspot and one
 * hottext, each site's href edited by its case.
 *
 * @param box - The package.
 * @returns Its entries, by path.
 */
export const sitePackage = (box: SiteBox): PackageEntries => {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const entries = new Map(everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 }));
  for (const name of siteNames) {
    const { path } = sites[name];
    const bytes = entries.get(path);
    if (bytes === undefined) {
      throw new Error(
        `The every-relation package writes no ${path}. Point the site generator's sites at the package's own documents.`,
      );
    }

    entries.set(path, encoder.encode(withHref(decoder.decode(bytes), name, box[name])));
  }

  return entries;
};

/**
 * The rule a site's case breaks, by reading 115 and information model §7.5, none for a listed
 * one: an href naming a file the package does not hold, "File exists", whatever its site; an
 * include naming no document of the package, by an entry it lists as none or no href, "Include
 * target", and none for one naming a file outside it, which is stored as written and never fetched
 * (reading 115); a section ref naming no section document, "Document entry", one with no href,
 * AL3's required attribute, and one naming a file outside the package, the stated limit "Remote
 * section ref" (reading 170): pantry imports offline and never fetches a section it does not
 * hold, and a section ref's section is the test's own content, so none can be assembled.
 *
 * @param name - The site.
 * @param href - Its case.
 * @returns The rule, or none.
 */
export const ruleOfCase = (name: SiteName, href: HrefCase): string | undefined => {
  if (href === "listed") {
    return undefined;
  }

  if (href === "absent") {
    return "file-exists";
  }

  if (sites[name].kind === "xi:include") {
    return href === "external" ? undefined : "include-target";
  }

  if (href === "external") {
    return "remote-section";
  }

  return href === "missing" ? "required-attribute" : "entry-kind";
};

/**
 * The rules a package of the box breaks outside the site laws: where no include places
 * `fragment.xml` (the fragment's file is absent, listed as no document, outside the package, or its
 * include writes no href), the fragment is judged as written, and its text entry's
 * `response-identifier`, its context variable's `identifier` and its `data-catalog-idref` name
 * declarations or catalogs only the item holds, none of its own document ("Idref target" and
 * "Catalog reference"). PostgreSQL reports whichever deferred key it checks first; for an absent
 * file it meets `File_exists` at INSERT before any of them. The other sites' documents hold no such
 * reference.
 *
 * @param box - The package.
 * @returns The rules.
 */
export const outsideRulesOfBox = (box: SiteBox): ReadonlySet<string> =>
  new Set(box.fragment === "listed" ? [] : ["idref-target"]);

/**
 * The rules a package of the box breaks, one per site whose case breaks one.
 *
 * @param box - The package.
 * @returns The rules.
 */
export const rulesOfBox = (box: SiteBox): ReadonlySet<string> =>
  new Set(
    siteNames.flatMap((name) => Option.toArray(Option.fromNullishOr(ruleOfCase(name, box[name])))),
  );
