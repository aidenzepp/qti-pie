/**
 * Reading 93's law over a resource's type, as a small exhausted box: {one type, two types, a type
 * that spells nothing} × {one path, two paths}, each an edit of `simple`'s manifest.
 *
 * A document has one type, so a path two resources name under two document types is refused under
 * "Document entry" (`entry-kind`) alone, never under RootOfType (package.ts's P3); a resource whose
 * `type` spells no handle names no type at all, so AL1's value domain refuses its `type` alone
 * (`attribute-lexical`, spec reading 67). The law oracle (`resource-types.oracle.test.ts`) and
 * PostgreSQL (`program.oracle.db.test.ts`) are each held to the verdicts here.
 */
import type { Edit } from "#pantry/test/fixtures.ts";

/**
 * A stimulus document, the second document type the box writes.
 */
const stimulus =
  '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-stimulus xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="stim" title="Stimulus"><qti-stimulus-body><p>A stimulus.</p></qti-stimulus-body></qti-assessment-stimulus>\n';

/**
 * `simple`'s one resource as its manifest writes it.
 */
const choiceResource = 'type="imsqti_item_xmlv3p0" href="choice.xml"';

/**
 * The type `simple`'s item resource is written with.
 */
const itemType = "imsqti_item_xmlv3p0";

/**
 * The type of the box's stimulus resources.
 */
const stimulusType = "imsqti_stimulus_xmlv3p0";

/**
 * Add a resource to the manifest, its one file its href.
 *
 * @param identifier - Its identifier.
 * @param type - Its type, as written.
 * @param href - Its href.
 * @returns The edit.
 */
const resource = (identifier: string, type: string, href: string): Edit => ({
  _tag: "ReplaceText",
  file: "imsmanifest.xml",
  replacement: `<resource identifier="${identifier}" type="${type}" href="${href}"><file href="${href}"/></resource></resources>`,
  search: "</resources>",
});

/**
 * One case of the box: its edits of `simple`; the laws the law oracle finds broken; the verdict,
 * the specification's, which the oracle and PostgreSQL each give; and the (path, type) pairs the
 * typed resources name, which `NamedHref` holds.
 */
export interface ResourceTypeCase {
  readonly broken: readonly string[];
  readonly edits: readonly Edit[];
  readonly label: string;
  readonly named: readonly (readonly [string, string])[];
  readonly resources: number;
  readonly typed: number;
  readonly verdict:
    | { readonly verdict: "accepted" }
    | { readonly rule: "attribute-lexical" | "entry-kind"; readonly verdict: "refused" };
}

/**
 * The seven cases: the box's six, and one path under two types with the stimulus listed first. In
 * that order the document is typed by its stimulus listing, so RootOfType breaks beside Document
 * entry, and the catalog's precedence names the refusal, entry-kind ahead of root-type-reverse
 * (reading 93; package.ts's P3).
 */
export const resourceTypeCases: readonly ResourceTypeCase[] = [
  {
    broken: [],
    edits: [],
    label: "one type, one path",
    named: [["choice.xml", itemType]],
    resources: 1,
    typed: 1,
    verdict: { verdict: "accepted" },
  },
  {
    broken: [],
    edits: [
      { _tag: "copyFile", from: "choice.xml", to: "choice2.xml" },
      resource("choice2", itemType, "choice2.xml"),
    ],
    label: "one type, two paths",
    named: [
      ["choice.xml", itemType],
      ["choice2.xml", itemType],
    ],
    resources: 2,
    typed: 2,
    verdict: { verdict: "accepted" },
  },
  {
    broken: ["Document entry"],
    edits: [resource("stim", stimulusType, "choice.xml")],
    label: "two types, one path",
    named: [
      ["choice.xml", itemType],
      ["choice.xml", stimulusType],
    ],
    resources: 2,
    typed: 2,
    verdict: { rule: "entry-kind", verdict: "refused" },
  },
  {
    broken: ["Document entry", "RootOfType"],
    edits: [
      {
        _tag: "ReplaceText",
        file: "imsmanifest.xml",
        replacement: `<resources><resource identifier="stim" type="${stimulusType}" href="choice.xml"><file href="choice.xml"/></resource>`,
        search: "<resources>",
      },
    ],
    label: "two types, one path, the stimulus listed first",
    named: [
      ["choice.xml", stimulusType],
      ["choice.xml", itemType],
    ],
    resources: 2,
    typed: 2,
    verdict: { rule: "entry-kind", verdict: "refused" },
  },
  {
    broken: [],
    edits: [
      { _tag: "addFile", path: "stim.xml", source: { text: stimulus } },
      resource("stim", stimulusType, "stim.xml"),
    ],
    label: "two types, two paths",
    named: [
      ["choice.xml", itemType],
      ["stim.xml", stimulusType],
    ],
    resources: 2,
    typed: 2,
    verdict: { verdict: "accepted" },
  },
  {
    broken: ["value domain"],
    edits: [
      {
        _tag: "ReplaceText",
        file: "imsmanifest.xml",
        replacement: choiceResource.replace(`type="${itemType}"`, `type=" ${itemType}"`),
        search: choiceResource,
      },
    ],
    label: "a type that spells nothing, one path",
    named: [],
    resources: 1,
    typed: 0,
    verdict: { rule: "attribute-lexical", verdict: "refused" },
  },
  {
    broken: ["value domain"],
    edits: [
      { _tag: "addFile", path: "stim.xml", source: { text: stimulus } },
      resource("stim", `${stimulusType} `, "stim.xml"),
    ],
    label: "a type that spells nothing, two paths",
    named: [["choice.xml", itemType]],
    resources: 2,
    typed: 1,
    verdict: { rule: "attribute-lexical", verdict: "refused" },
  },
];
