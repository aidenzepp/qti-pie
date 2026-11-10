/**
 * The claims of area m5, written by issue m5-10, the only writer of this file: the fourteen rows
 * where plate passes a Personal Needs and Preferences feature to the host and renders nothing for
 * it. They are the on-screen tools (A-12, A-18, A-27, A-31, A-32, A-33, A-39, A-43, A-45), hazard
 * avoidance (A-16), input requirements (A-19), item translation (A-21), the language of the
 * interface (A-25) and activate-as-option (A-46). Each is bounded by a member-only source, and its
 * tests, tagged with its ID, prove what plate does: the reader exposes the preference, and
 * rendering is unchanged by it.
 *
 * A-34 and A-47 are not claims: the reader's sets and the catalog they reach are covered.
 *
 * @module
 */
import type { Claim } from "#plate/ledger/claims.ts";

/**
 * Write the source of a tool row's claim: the on-screen tool is the delivery system's, and plate
 * only hands the preference to the host.
 *
 * @param tool The tool as the claim names it, such as "calculator".
 * @returns The claim's source, in words.
 */
const toolSource = (tool: string): string =>
  `the on-screen ${tool} is the delivery system's, per the AfA PNP 3.0 obligations; plate passes the preference to the host in PnpSupports.tools, and what a renderer must show beyond that is fixed by the certification checklist, which is member-only`;

/**
 * Area m5's claims, each bounded by a member-only source, in Appendix A's order.
 */
export const m5Claims: readonly Claim[] = [
  { id: "A-12", source: toolSource("calculator") },
  {
    id: "A-16",
    source:
      "plate passes hazard avoidance to the host in PnpSupports.hazards and reads no content hazard metadata; which content counts as a hazard is fixed by the certification checklist, which is member-only",
  },
  { id: "A-18", source: toolSource("homophone checker") },
  {
    id: "A-19",
    source:
      "plate's controls are native and stay operable by every input whatever the PNP asks; switch and touchscreen operation are the user agent's and the host's, and the checklist that fixes them is member-only",
  },
  {
    id: "A-21",
    source:
      "delivering an item's language variant is the delivery system's, per the AfA PNP 3.0 obligations; plate passes the requested language to the host in PnpSupports.languages and renders the item it is given; the rest is fixed by the certification checklist, which is member-only",
  },
  {
    id: "A-25",
    source:
      "plate writes its own interface text in English only, its one locale (a stated limit), and passes the PNP's language of interface to the host in Supports.display.languageOfInterface; the interface languages a system must offer are fixed by the member-only certification checklist",
  },
  { id: "A-27", source: toolSource("line reader") },
  { id: "A-31", source: toolSource("note-taking tool") },
  { id: "A-32", source: toolSource("outliner") },
  { id: "A-33", source: toolSource("peer-interaction tool") },
  { id: "A-39", source: toolSource("spell checker") },
  { id: "A-43", source: toolSource("thesaurus") },
  { id: "A-45", source: toolSource("visual organizer") },
  {
    id: "A-46",
    source:
      "plate lists an as-option feature in PnpSupports.optional and turns it on only when the host passes it in supports; the option the candidate uses is the host's, fixed by the member-only certification checklist",
  },
];
