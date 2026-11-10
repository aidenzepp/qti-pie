/**
 * Portable Custom Interaction (Q-16, kind `portable-custom`): the model a `qti-portable-custom-
 * interaction` is read into, and what a server renders of it without script, as everything a host
 * can compute there.
 *
 * The readings that bind this module, by their wording: "A PCI has exactly one
 * `qti-interaction-markup`, which may be empty" (`open` enforces it; an empty markup renders an
 * empty Markup part), and "A PCI's secondary module configuration is `secondary-configuration`"
 * (an item writing `fallback-configuration` is refused by `open` before this module reads it).
 *
 * `parse` reads the element through the kit the body walk hands it: its `custom-interaction-type-
 * identifier`, its `module`, its `response-identifier` and the declaration it names, its `data-*`
 * attributes as the `properties` a host passes a PCI, named as HTML's `dataset` names them
 * ({@link datasetName}), its `qti-prompt`, its `qti-interaction-modules` as written (the two
 * configurations, each `qti-interaction-module`'s `id` and paths), its one
 * `qti-interaction-markup` (its body content read as the body walk reads the item body, so its
 * printed variables, feedback and template content resolve as the body's do, and each HTML
 * `template` at its end kept apart), its `qti-template-variable` and `qti-context-variable`
 * identifiers, and, in QTI 3.0.1, its `qti-stylesheet` and `qti-catalog-info`, which are marks
 * here (issue pci-05 renders them).
 *
 * `render` emits this structure: a `qti-portable-custom-interaction` Root carrying `data-pci-type`
 * (the type identifier), `data-pci-status` (from the render mode: an answering render is
 * `interacting`, `review` is `review`, `solution` is `solution`), `data-entry-name` (the name the
 * response travels under, decision D2: the runtime of issue pci-05 writes a hidden input under it),
 * `data-pci-configuration` (one JSON attribute: `properties`, `responseIdentifier`, and the
 * template and context variable identifiers, which issue pci-04's frame host reads), and, when the
 * host passes its `pci` facts (`RedactKit.host`, `PciHostFacts` in `#plate/pci/host.ts`) and routed
 * this PCI's response, `data-pci-routes` (the classified routes, JSON), `data-pci-loader` (the AMD
 * loader's URL) and `data-pci-entry` (the `module` attribute, when written), and `role="group"`
 * named by its Prompt; then the Prompt, when the item has one; the Markup, the element a PCI is
 * handed as `dom`, holding the transformed markup and each `template` copied inert as an HTML
 * `template`; and the Notice, an English sentence that the interaction needs the page's script
 * (decision D3, WCAG 3.3.2), which issue pci-04's runtime hides, followed by one sentence for each
 * module the author named that the host's routes do not cover. The module facts as written
 * (`module`, `modules`) stay on the model node, read by `parse` and handed to nothing but the
 * dropped-module notice and the routes' matching: only the host that holds the package classifies
 * them, and the page sees the host's routes, never an unclassified path. Without host facts the
 * Root carries none of the three, and the Notice says the PCI cannot run here. The payload holds no
 * correct value and no template value: the bound variables' values reach the PCI through the frame
 * host, never through the page.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { SourceElement } from "#plate/document/source.ts";
import { emitNodes, nestedInteraction } from "#plate/emit/body.ts";
import { text, when } from "#plate/emit/node.ts";
import type { Attributes, PartFunction } from "#plate/emit/node.ts";
import { authoredIdrefs, scopedId } from "#plate/emit/parts.ts";
import type { PartRow } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import { partRow } from "#plate/interactions/contract.ts";
import type {
  InteractionModule,
  ModuleInteraction,
  OwnRegion,
  PartSpec,
  ReaderKit,
} from "#plate/interactions/contract.ts";
import type { BodyNode } from "#plate/model/item.ts";
import { isModelled, nullOf, trimXmlSpace } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import type { EmitState, Payload, PayloadNode, RenderMode } from "#plate/payload.ts";
import type { PciHostFacts, PciModuleRoute } from "#plate/pci/host.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * The owner of every Portable Custom Interaction part in the part table.
 */
const owner = "portable-custom-interaction";

/**
 * Portable Custom Interaction's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-16";

/**
 * The QTI element Portable Custom Interaction is read from.
 */
const element = "qti-portable-custom-interaction";

/**
 * One `qti-interaction-module` of a Portable Custom Interaction (Q-16), as written: its `id`, and
 * its `primary-path` and `fallback-path`, each none when absent. The module resolves no path
 * (issue pci-01's `resolvePciModules` does); it carries them to the frame host.
 */
export interface PortableCustomModuleRef {
  readonly fallbackPath: Option.Option<string>;
  readonly id: string;
  readonly primaryPath: Option.Option<string>;
}

/**
 * A Portable Custom Interaction's (Q-16) `qti-interaction-modules`, as written: its
 * `primary-configuration` and `secondary-configuration`, each none when absent, and its modules in
 * document order.
 */
export interface PortableCustomModules {
  readonly modules: readonly PortableCustomModuleRef[];
  readonly primaryConfiguration: Option.Option<string>;
  readonly secondaryConfiguration: Option.Option<string>;
}

/**
 * One property a host passes a Portable Custom Interaction (Q-16): a `data-*` attribute of the
 * element, its name as HTML's `dataset` names it ({@link datasetName}) and its value as written.
 */
export interface PortableCustomProperty {
  readonly name: string;
  readonly value: string;
}

/**
 * The model node of a Portable Custom Interaction (Q-16, kind `portable-custom`): the fields every
 * module's node shares, and what the element gives beyond them.
 */
export interface PortableCustomInteraction extends ModuleInteraction<"portable-custom"> {
  /**
   * The bound declaration's `base-type` as written, none when absent, outside the vocabulary or
   * undeclared: a PCI binds a response of any base type its module defines.
   */
  readonly baseType: Option.Option<string>;
  /**
   * The bound declaration's `cardinality` as written, none when absent, outside the vocabulary or
   * undeclared.
   */
  readonly cardinality: Option.Option<string>;
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * The `identifier` of each `qti-context-variable`, in document order.
   */
  readonly contextVariables: readonly string[];
  /**
   * The children of each HTML `template` of the markup, in document order, each read as body
   * content, which the render copies inert.
   *
   * The name is not `templates`: the redacted JSON form carries this field under the same name,
   * and `templates` is a key the redaction sweep refuses at any depth of a redacted item, as the
   * name of an item's template declarations and a record's template values, which a page must
   * never hold. This field holds neither: it is the author's inert `template` content, which the
   * PCI activates (Q-16, issue pci-03b).
   */
  readonly inertTemplates: readonly (readonly BodyNode[])[];
  /**
   * The content of the one `qti-interaction-markup` but for its `template` elements, read as the
   * body walk reads the item body; empty for an empty markup.
   */
  readonly markup: readonly BodyNode[];
  /**
   * The `module` attribute, the AMD module id, none when absent (then `modules` names it).
   */
  readonly module: Option.Option<string>;
  readonly modules: Option.Option<PortableCustomModules>;
  readonly properties: readonly PortableCustomProperty[];
  readonly prompt: Option.Option<readonly BodyNode[]>;
  /**
   * The `template-identifier` of each `qti-template-variable`, in document order.
   */
  readonly templateVariables: readonly string[];
  /**
   * `custom-interaction-type-identifier`, the URI naming the PCI type, as written.
   */
  readonly typeIdentifier: string;
}

/**
 * The configuration a Portable Custom Interaction (Q-16) is given, as the Root's
 * `data-pci-configuration` writes it for the frame host (issue pci-04): the `properties`, the
 * `responseIdentifier`, and the template and context variable identifiers. It holds no value of
 * any variable, and no module fact: the module facts as written (`module`, `modules`) stay on the
 * model node for the host's resolution, and reach the page only as the host's classified routes
 * ({@link PortableCustomHost}), so an unclassified path never reaches it.
 */
export interface PortableCustomConfiguration {
  readonly contextVariables: readonly string[];
  readonly properties: readonly PortableCustomProperty[];
  readonly responseIdentifier: string;
  readonly templateVariables: readonly string[];
}

/**
 * What the host told the module of this PCI through `RedactKit.host.pci` (`PciHostFacts` in
 * `#plate/pci/host.ts`), as the Root writes it for the frame host (issue pci-04): the URL of the
 * AMD loader the host serves (`data-pci-loader`), the classified routes the host resolved for
 * the PCI's response, in route order (`data-pci-routes`), and the entry module's id, the PCI's
 * `module` attribute, when it names one (`data-pci-entry`). `dropped` names each module the author
 * wrote (`module`, and each `qti-interaction-module`'s `id`) that no route covers, in the order
 * written and each once, which the Notice part shows so an author sees it, not silence.
 */
export interface PortableCustomHost {
  readonly dropped: readonly string[];
  readonly entry: Option.Option<string>;
  readonly loader: string;
  readonly routes: readonly PciModuleRoute[];
}

/**
 * The payload node of a Portable Custom Interaction (Q-16, kind `portable-custom`): what the page
 * may know of the model node, its content copied through the payload's kit, the name its
 * response travels under, and what the host told the module of this PCI. It holds no correct
 * value, no template value and no stored value: the runtime of issue pci-05 writes the response,
 * and the frame host of issue pci-04 hands the PCI its values.
 */
export interface PortableCustomPayload {
  readonly ariaLabel: Option.Option<string>;
  readonly ariaLabelledby: Option.Option<string>;
  readonly class: string;
  readonly configuration: PortableCustomConfiguration;
  /**
   * The name the response's controls post under: the view's name for it, else
   * `entryName(instance, response)`, which the Root carries as `data-entry-name`.
   */
  readonly formName: string;
  /**
   * What the host told the module of this PCI ({@link PortableCustomHost}); none when the host
   * passed no `pci` facts, or routed nothing for this PCI's response, and then the Root carries
   * no route, no loader and no entry, and the Notice says the PCI cannot run here.
   */
  readonly host: Option.Option<PortableCustomHost>;
  /**
   * The content of each HTML `template` of the markup, copied through the payload's kit, which the
   * render writes inert.
   *
   * The name is not `templates`, for the reason {@link PortableCustomInteraction.inertTemplates}
   * gives: the redaction sweep refuses that key at any depth of a redacted item, and this field
   * holds the author's inert content, no template declaration and no template value (Q-16, issue
   * pci-03b).
   */
  readonly inertTemplates: readonly (readonly PayloadNode[])[];
  readonly markup: readonly PayloadNode[];
  readonly prompt: Option.Option<readonly PayloadNode[]>;
  readonly response: string;
  readonly typeIdentifier: string;
}

/**
 * One `qti-interaction-module` in the JSON form: each absent path written as no key.
 */
export interface PortableCustomModuleRefJson {
  readonly fallbackPath?: string;
  readonly id: string;
  readonly primaryPath?: string;
}

/**
 * The model node of a Portable Custom Interaction (Q-16) in a redacted body's JSON form: every
 * field of {@link PortableCustomInteraction} but `path`, which the form never holds, each option
 * an optional key absent when none, and each body content in the body's JSON form (`unknown`
 * here, as the codec's recursive body type is its own).
 */
export interface PortableCustomJson {
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly baseType?: string;
  readonly cardinality?: string;
  readonly class: string;
  readonly contextVariables: readonly string[];
  /**
   * The content of each HTML `template` of the markup, in the body's JSON form.
   *
   * The key is not `templates`, for the reason {@link PortableCustomInteraction.inertTemplates}
   * gives: the redaction sweep refuses that key at any depth of a redacted item's JSON, and this
   * key holds the author's inert content, no template declaration and no template value (Q-16,
   * issue pci-03b).
   */
  readonly inertTemplates: readonly (readonly unknown[])[];
  readonly kind: "portable-custom";
  readonly markup: readonly unknown[];
  readonly module?: string;
  readonly modules?: {
    readonly modules: readonly PortableCustomModuleRefJson[];
    readonly primaryConfiguration?: string;
    readonly secondaryConfiguration?: string;
  };
  readonly properties: readonly PortableCustomProperty[];
  readonly prompt?: readonly unknown[];
  readonly response: string;
  readonly templateVariables: readonly string[];
  readonly typeIdentifier: string;
}

/**
 * The parts of a Portable Custom Interaction (Q-16), each a `PartSpec` `partRow` derives the row
 * of: the Root, the Prompt, the Markup (the element a PCI is handed as `dom`), the Template (each
 * HTML `template` of the markup, copied inert) and the Notice (the sentence shown without script).
 */
const parts = {
  markup: {
    defaults: {},
    element: "div",
    listOwner: false,
    merged: [],
    tagClass: "flow-container",
  },
  notice: {
    defaults: {},
    element: "p",
    listOwner: false,
    merged: [],
    tagClass: "prompt",
  },
  prompt: {
    defaults: {},
    element: "qti-prompt",
    listOwner: false,
    merged: ["id"],
    tagClass: "prompt",
  },
  root: {
    defaults: {},
    element,
    listOwner: false,
    merged: [
      "role",
      "aria-labelledby",
      "aria-label",
      "class",
      "data-entry-name",
      "data-pci-type",
      "data-pci-status",
      "data-pci-configuration",
      "data-pci-routes",
      "data-pci-loader",
      "data-pci-entry",
    ],
    tagClass: "flow-container",
  },
  template: {
    defaults: {},
    element: "template",
    listOwner: false,
    merged: [],
    tagClass: "any",
  },
} as const satisfies { readonly [Q in PortableCustomPart]: PartSpec };

/**
 * A Portable Custom Interaction part.
 */
type PortableCustomPart = "markup" | "notice" | "prompt" | "root" | "template";

/**
 * The row of every Portable Custom Interaction part, which no placement changes.
 */
const rows = {
  markup: partRow({ owner, parts }, "markup"),
  notice: partRow({ owner, parts }, "notice"),
  prompt: partRow({ owner, parts }, "prompt"),
  root: partRow({ owner, parts }, "root"),
  template: partRow({ owner, parts }, "template"),
} satisfies { readonly [P in PortableCustomPart]: PartRow };

/**
 * The attributes of every part of one Portable Custom Interaction, computed once by
 * {@link connect}: one set per Template, in the templates' order.
 */
interface Connected {
  readonly inertTemplates: readonly Attributes[];
  readonly markup: Attributes;
  readonly notice: Attributes;
  readonly prompt: Attributes;
  readonly root: Attributes;
  readonly [part: string]: Attributes | readonly Attributes[];
}

/**
 * The sentence the Notice shows without script, local to this module (decision D7): it says
 * plainly that the interaction cannot be answered here (WCAG 3.3.2).
 */
const noticeText = "This interaction needs the page's script and cannot be answered here.";

/**
 * Write the sentence the Notice adds for each module the author named that the host's facts do
 * not route ({@link PortableCustomHost.dropped}), local to this module as its other strings are.
 *
 * @param id The module's id as written.
 * @returns The sentence, naming the id in quotes.
 */
const droppedText = (id: string): string =>
  `The host does not serve the module ${JSON.stringify(id)} this interaction names.`;

/**
 * The status a PCI is given for each render mode: an answering render is `interacting`, `review`
 * is `review`, `solution` is `solution`. `suspended` and `closed` are states no render shows.
 */
const statusOf: Readonly<Record<RenderMode, string>> = {
  answering: "interacting",
  review: "review",
  solution: "solution",
};

/**
 * The QTI children of the element this module owns inside the content it reads, which the body
 * walk would otherwise give a notice for; none of them sits inside the markup by the XSD, so the
 * list is the module's claim, not a transform.
 */
const ownedChildren = [
  "qti-interaction-modules",
  "qti-interaction-module",
  "qti-template-variable",
  "qti-context-variable",
] as const;

/**
 * Name a `data-*` attribute as HTML's `dataset` names it: the `data-` prefix removed, and each `-`
 * followed by an ASCII lowercase letter removed with that letter upper-cased, so
 * `data-max-choices-message` is `maxChoicesMessage` and `data-start_value-2` is `start_value-2`.
 *
 * @param local The attribute's local name, starting with `data-`.
 * @returns The dataset name.
 * @see https://html.spec.whatwg.org/multipage/dom.html#dom-dataset
 */
const datasetName = (local: string): string =>
  local
    .slice("data-".length)
    .replaceAll(/-(?<letter>[a-z])/gu, (_match, letter: string) => letter.toUpperCase());

/**
 * Read the `data-*` attributes of the element as the properties a host passes the PCI, in
 * document order.
 *
 * @param pci The element.
 * @returns The properties.
 */
const propertiesOf = (pci: SourceElement): readonly PortableCustomProperty[] =>
  pci.attributes.flatMap((attribute) =>
    attribute.namespace === "" && attribute.local.startsWith("data-")
      ? [{ name: datasetName(attribute.local), value: attribute.value }]
      : [],
  );

/**
 * Read the `qti-interaction-modules` of the element as written, none when it has none.
 *
 * @param read The kit.
 * @param pci The element.
 * @returns The modules; a module without an `id`, which the validator refuses first, has the
 *   empty one.
 */
const modulesOf = (read: ReaderKit, pci: SourceElement): Option.Option<PortableCustomModules> =>
  Option.map(
    Option.fromUndefinedOr(read.childrenNamed(pci, "qti-interaction-modules")[0]),
    (modules) => {
      read.markElement(modules);

      return {
        modules: read.childrenNamed(modules, "qti-interaction-module").map((module) => {
          read.markElement(module);

          return {
            fallbackPath: read.valueOf(module, "fallback-path"),
            id: Option.getOrElse(read.valueOf(module, "id"), () => ""),
            primaryPath: read.valueOf(module, "primary-path"),
          };
        }),
        primaryConfiguration: read.valueOf(modules, "primary-configuration"),
        secondaryConfiguration: read.valueOf(modules, "secondary-configuration"),
      };
    },
  );

/**
 * Read the one `qti-interaction-markup`: its children but for each HTML `template`, read as body
 * content with the module's own elements let through, and each `template`'s children read the
 * same way, kept apart. An absent or empty markup gives no content and no template.
 *
 * @param read The kit.
 * @param pci The element.
 * @returns The markup content and the templates' content, or the body walk's refusal.
 */
const markupOf = (
  read: ReaderKit,
  pci: SourceElement,
): Result.Result<
  {
    readonly inertTemplates: readonly (readonly BodyNode[])[];
    readonly markup: readonly BodyNode[];
  },
  Refusal
> =>
  Result.gen(function* readMarkup() {
    const [found] = read.childrenNamed(pci, "qti-interaction-markup");
    if (found === undefined) {
      return { inertTemplates: [], markup: [] };
    }

    read.markElement(found);

    const isTemplate = (child: SourceElement): boolean => read.isQti(child, "template");
    const own = [...ownedChildren];
    const markup = yield* read.nodes(found, {
      children: found.children.filter((child) => !(child.kind === "element" && isTemplate(child))),
      own,
    });
    const inertTemplates: (readonly BodyNode[])[] = [];
    for (const template of read.elementsOf(found).filter(isTemplate)) {
      read.markElement(template);
      inertTemplates.push(yield* read.nodes(template, { own }));
    }

    return { inertTemplates, markup };
  });

/**
 * Read the identifier attribute of each child of one name, in document order.
 *
 * @param read The kit.
 * @param pci The element.
 * @param local The children's local name.
 * @param name The attribute each carries.
 * @returns The identifiers, or the refusal `missing-attribute` for a child without one.
 */
const identifiersOf = (
  read: ReaderKit,
  pci: SourceElement,
  local: string,
  name: string,
): Result.Result<readonly string[], Refusal> =>
  Result.gen(function* readIdentifiers() {
    const identifiers: string[] = [];
    for (const child of read.childrenNamed(pci, local)) {
      read.markElement(child);
      identifiers.push(yield* read.identifierAttribute(child, name));
    }

    return identifiers;
  });

/**
 * Write the configuration as the Root's `data-pci-configuration` attribute: JSON with its keys
 * in a fixed order, `properties` as an object by dataset name (a name written twice keeps the
 * last value, as `dataset` does), and no module fact.
 *
 * @param configuration The configuration.
 * @returns The JSON text.
 */
const configurationJson = (configuration: PortableCustomConfiguration): string =>
  JSON.stringify({
    contextVariables: configuration.contextVariables,
    properties: Object.fromEntries(
      configuration.properties.map(({ name, value }) => [name, value] as const),
    ),
    responseIdentifier: configuration.responseIdentifier,
    templateVariables: configuration.templateVariables,
  });

/**
 * Write the host's routes as the Root's `data-pci-routes` attribute: a JSON array in route order,
 * each route `{ id, primary, fallback, waitSeconds: { primary, fallback } }` with an absent
 * location written as no key, never as an empty string.
 *
 * @param routes The routes the host resolved for this PCI.
 * @returns The JSON text.
 */
const routesJson = (routes: readonly PciModuleRoute[]): string =>
  JSON.stringify(
    routes.map((route) => ({
      id: route.id,
      ...Option.match(route.primary, {
        onNone: () => ({}),
        onSome: (primary) => ({ primary }),
      }),
      ...Option.match(route.fallback, {
        onNone: () => ({}),
        onSome: (fallback) => ({ fallback }),
      }),
      waitSeconds: { fallback: route.waitSeconds.fallback, primary: route.waitSeconds.primary },
    })),
  );

/**
 * List the module ids the author wrote: the `module` attribute, then each listed
 * `qti-interaction-module`'s `id`, in document order and each once.
 *
 * @param interaction The model node.
 * @returns The ids named.
 */
const namedModules = (interaction: PortableCustomInteraction): readonly string[] => [
  ...new Set([
    ...Option.toArray(interaction.module),
    ...interaction.modules.pipe(
      Option.map((modules) => modules.modules.map((module) => module.id)),
      Option.getOrElse((): readonly string[] => []),
    ),
  ]),
];

/**
 * Read what the host told the module of one PCI: the routes the facts hold for its response, the
 * loader, the entry it names, and each named module no route covers (the dropped ones, which the
 * Notice shows). None when the host passed no `pci` facts, or routed nothing for the response.
 *
 * @param interaction The model node.
 * @param facts The host's `pci` facts, when it passed them.
 * @returns What the Root writes of the host.
 */
const hostOf = (
  interaction: PortableCustomInteraction,
  facts: PciHostFacts | undefined,
): Option.Option<PortableCustomHost> =>
  Option.fromUndefinedOr(facts).pipe(
    Option.flatMap((pci) =>
      Option.map(Option.fromUndefinedOr(pci.modules.get(interaction.response)), (routes) => {
        const routed = new Set(routes.map((route) => route.id));

        return {
          dropped: namedModules(interaction).filter((id) => !routed.has(id)),
          entry: interaction.module,
          loader: pci.loader,
          routes,
        };
      }),
    ),
  );

/**
 * Give the names the author wrote for the Root, as `authorsName` in `#plate/interactions/name.ts`
 * gives a text control's (that module reaches the module table, so this one cannot import it):
 * `aria-label` as written unless blank, and `aria-labelledby` with each id scoped by the instance
 * through `authoredIdrefs`; each absent when the author wrote none.
 *
 * @param interaction The payload node.
 * @param instance The item instance key.
 * @returns The name attributes.
 */
const authorsNames = (interaction: PortableCustomPayload, instance: string): Attributes => ({
  ...Option.match(
    interaction.ariaLabel.pipe(Option.filter((label) => trimXmlSpace(label) !== "")),
    { onNone: () => ({}), onSome: (label) => ({ "aria-label": label }) },
  ),
  ...Option.match(
    interaction.ariaLabelledby.pipe(Option.flatMap((ids) => authoredIdrefs(instance, ids))),
    { onNone: () => ({}), onSome: (ids) => ({ "aria-labelledby": ids }) },
  ),
});

/**
 * Compute every attribute of every part of one Portable Custom Interaction: the connect function.
 *
 * - Root: the marker, the state (`data-mode`, and `data-disabled` when the author disabled every
 *   control), the author's `class`, `data-pci-type`, `data-pci-status` ({@link statusOf}),
 *   `data-entry-name` and `data-pci-configuration` ({@link configurationJson}); with host facts,
 *   `data-pci-routes` ({@link routesJson}), `data-pci-loader` and, when the PCI names its entry,
 *   `data-pci-entry`, and without them none of the three; `role="group"` named by the Prompt
 *   through `aria-labelledby` when there is one, else the author's names.
 * - Prompt: the marker and its id.
 * - Markup, Template, Notice: the marker.
 *
 * @param interaction The payload node.
 * @param payload The payload, which gives the instance, the mode and `finished`.
 * @returns The attributes of every part.
 */
const connect = (interaction: PortableCustomPayload, payload: Payload): Connected => {
  const promptId = scopedId(payload.instance, interaction.response, "prompt");

  return {
    inertTemplates: interaction.inertTemplates.map(() => ({ "data-slot": rows.template.slot })),
    markup: { "data-slot": rows.markup.slot },
    notice: { "data-slot": rows.notice.slot },
    prompt: { "data-slot": rows.prompt.slot, id: promptId },
    root: {
      ...(Option.isSome(interaction.prompt)
        ? { "aria-labelledby": promptId, role: "group" }
        : authorsNames(interaction, payload.instance)),
      ...when(interaction.class !== "", { class: interaction.class }),
      ...when(payload.finished, { "data-disabled": true }),
      "data-entry-name": interaction.formName,
      "data-mode": payload.mode,
      "data-pci-configuration": configurationJson(interaction.configuration),
      ...Option.match(interaction.host, {
        onNone: () => ({}),
        onSome: (host) => ({
          ...Option.match(host.entry, {
            onNone: () => ({}),
            onSome: (entry) => ({ "data-pci-entry": entry }),
          }),
          "data-pci-loader": host.loader,
          "data-pci-routes": routesJson(host.routes),
        }),
      }),
      "data-pci-status": statusOf[payload.mode],
      "data-pci-type": interaction.typeIdentifier,
      "data-slot": rows.root.slot,
    },
  };
};

/**
 * Give the embedder's replacement for each part, from the resolved overrides of a render.
 *
 * @param state The emit state, which holds the resolved part overrides.
 * @returns The replacement of a part, none for the default element.
 */
const replacementIn =
  (state: EmitState) =>
  (part: PortableCustomPart): PartFunction<Attributes> | undefined =>
    Option.getOrUndefined(state.parts.replacementFor(owner, part));

/**
 * Give the Portable Custom Interaction a region of its own content.
 *
 * @param part Which content it is.
 * @param nodes The content.
 * @returns The region, with no choice.
 */
const regionOf = (part: "content" | "prompt", nodes: readonly BodyNode[]): OwnRegion => ({
  choice: Option.none(),
  nodes,
  part,
  written: "nodes",
});

/**
 * The Portable Custom Interaction module (Q-16, kind `portable-custom`).
 */
export const portableCustomModule: InteractionModule<
  "portable-custom",
  PortableCustomInteraction,
  PortableCustomPayload,
  PortableCustomPart,
  PortableCustomJson
> = {
  /**
   * The one response Portable Custom Interaction binds, of whatever base type and cardinality its
   * declaration writes; its posted text has no number base, as the runtime posts Appendix C JSON.
   */
  bindings: (interaction) => [{ base: Option.none(), response: interaction.response }],
  /**
   * Portable Custom Interaction's connect function ({@link connect}), its locale unread: every
   * string it writes is this module's own.
   */
  connect: (interaction, payload) => connect(interaction, payload),
  /**
   * The nodes the render writes as content: the markup, then each template's content.
   */
  content: (interaction) => [...interaction.markup, ...interaction.inertTemplates.flat()],
  /**
   * No Control: without script the server renders none, so the renderer numbers none (Q10).
   */
  controls: () => 0,
  element,
  feature,
  implemented: true,
  kind: "portable-custom",
  /**
   * The NULL of the bound declaration's type when the value model holds it, else a single
   * string's.
   */
  nullValue: (interaction) =>
    nullOf(
      interaction.baseType.pipe(
        Option.filter(isModelled),
        Option.getOrElse(() => "string" as const),
      ),
      interaction.cardinality.pipe(
        Option.flatMap((cardinality): Option.Option<Value["cardinality"]> =>
          cardinality === "multiple" || cardinality === "ordered" || cardinality === "single"
            ? Option.some(cardinality)
            : Option.none(),
        ),
        Option.getOrElse((): Value["cardinality"] => "single"),
      ),
    ),
  owner,
  /**
   * Read the element through the kit: its attributes, its Prompt, its modules as written, its
   * markup and templates, its variable identifiers, and a mark for each 3.0.1 `qti-stylesheet`
   * and `qti-catalog-info` (issue pci-05 renders them).
   */
  parse: (pci, { read }) =>
    Result.gen(function* readPortableCustom() {
      read.markElement(pci);

      const response = yield* read.identifierAttribute(pci, "response-identifier");
      const typeIdentifier = yield* read.requiredValue(pci, "custom-interaction-type-identifier");
      const prompt = yield* read.content(pci, "qti-prompt");
      const modules = modulesOf(read, pci);
      const { inertTemplates, markup } = yield* markupOf(read, pci);
      const templateVariables = yield* identifiersOf(
        read,
        pci,
        "qti-template-variable",
        "template-identifier",
      );
      const contextVariables = yield* identifiersOf(
        read,
        pci,
        "qti-context-variable",
        "identifier",
      );
      for (const marked of ["qti-stylesheet", "qti-catalog-info"]) {
        for (const child of read.childrenNamed(pci, marked)) {
          read.mark(child, marked);
        }
      }

      return {
        ariaLabel: read.valueOf(pci, "aria-label"),
        ariaLabelledby: read.valueOf(pci, "aria-labelledby"),
        baseType: read.bound.pipe(Option.flatMap((bound) => bound.baseType)),
        cardinality: read.bound.pipe(Option.flatMap((bound) => bound.cardinality)),
        class: Option.getOrElse(read.valueOf(pci, "class"), () => ""),
        contextVariables,
        inertTemplates,
        kind: "portable-custom",
        markup,
        module: read.valueOf(pci, "module"),
        modules,
        path: read.pathOf(pci),
        prompt,
        properties: propertiesOf(pci),
        response,
        templateVariables,
        typeIdentifier,
      };
    }),
  parts,
  /**
   * The Schema of the model node's JSON form: every field but `path`, which the form never holds,
   * each option an optional key.
   */
  payloadSchema: ({ BodyNodes, NoPath, OptionalText, Schema }) =>
    Schema.Struct({
      ariaLabel: OptionalText,
      ariaLabelledby: OptionalText,
      baseType: OptionalText,
      cardinality: OptionalText,
      class: Schema.String,
      contextVariables: Schema.Array(Schema.String),
      inertTemplates: Schema.Array(BodyNodes),
      kind: Schema.Literal("portable-custom"),
      markup: BodyNodes,
      module: OptionalText,
      modules: Schema.OptionFromOptionalKey(
        Schema.Struct({
          modules: Schema.Array(
            Schema.Struct({
              fallbackPath: OptionalText,
              id: Schema.String,
              primaryPath: OptionalText,
            }),
          ),
          primaryConfiguration: OptionalText,
          secondaryConfiguration: OptionalText,
        }),
      ),
      path: NoPath,
      prompt: Schema.OptionFromOptionalKey(BodyNodes),
      properties: Schema.Array(Schema.Struct({ name: Schema.String, value: Schema.String })),
      response: Schema.String,
      templateVariables: Schema.Array(Schema.String),
      typeIdentifier: Schema.String,
    }),
  /**
   * Copy the model node into its payload node: its content through the kit, the configuration,
   * the name the response travels under, and what the host told the module of this PCI through
   * `kit.host.pci` ({@link hostOf}): the routes for its response, the loader, the entry, and each
   * module the author named that the routes do not cover, which the Notice shows. The written
   * module facts reach the payload node through nothing else: the routes replace them. The kit's
   * shown values, posted strings, seed and unnamed position are not read: the page shows no value
   * of the response without script.
   */
  redact: (interaction, kit) => ({
    ariaLabel: interaction.ariaLabel,
    ariaLabelledby: interaction.ariaLabelledby,
    class: interaction.class,
    configuration: {
      contextVariables: interaction.contextVariables,
      properties: interaction.properties,
      responseIdentifier: interaction.response,
      templateVariables: interaction.templateVariables,
    },
    formName: kit.formName(interaction.response),
    host: hostOf(interaction, kit.host.pci),
    inertTemplates: interaction.inertTemplates.map((nodes) => kit.nodes(nodes)),
    markup: kit.nodes(interaction.markup),
    prompt: interaction.prompt.pipe(Option.map((nodes) => kit.nodes(nodes))),
    response: interaction.response,
    typeIdentifier: interaction.typeIdentifier,
  }),
  /**
   * The regions, in document order: the Prompt, the markup, then each template's content.
   */
  regions: (interaction) => [
    ...interaction.prompt.pipe(
      Option.map((nodes) => regionOf("prompt", nodes)),
      Option.toArray,
    ),
    regionOf("content", interaction.markup),
    ...interaction.inertTemplates.map((nodes) => regionOf("content", nodes)),
  ],
  /**
   * Render the Root holding the Prompt, the Markup with its Templates, and the Notice, each part
   * through `applyPart` with its replacement from `state.parts`.
   *
   * @throws {NestedInteractionDefect} When the content holds an interaction, which QTI's schema
   *   admits nowhere in a PCI (`nestedInteraction`).
   */
  render: (interaction, payload, state) =>
    Result.gen(function* portableCustomRoot() {
      const replacement = replacementIn(state);
      const props = connect(interaction, payload);
      const emit = (nodes: readonly PayloadNode[]) =>
        emitNodes(nodes, payload, state, nestedInteraction(owner));

      const prompt = yield* Result.transposeOption(
        interaction.prompt.pipe(
          Option.map((nodes) =>
            Result.flatMap(emit(nodes), (emitted) =>
              applyPart(rows.prompt, props.prompt, emitted, replacement("prompt")),
            ),
          ),
        ),
      );
      const templateParts = yield* Result.all(
        interaction.inertTemplates.map((nodes, index) =>
          Result.flatMap(emit(nodes), (emitted) =>
            applyPart(
              rows.template,
              props.inertTemplates[index] ?? { "data-slot": rows.template.slot },
              emitted,
              replacement("template"),
            ),
          ),
        ),
      );
      const markup = yield* applyPart(
        rows.markup,
        props.markup,
        [...(yield* emit(interaction.markup)), ...templateParts],
        replacement("markup"),
      );
      const notice = yield* applyPart(
        rows.notice,
        props.notice,
        [
          text(
            [
              noticeText,
              ...interaction.host.pipe(
                Option.map((host) => host.dropped.map(droppedText)),
                Option.getOrElse((): readonly string[] => []),
              ),
            ].join(" "),
          ),
        ],
        replacement("notice"),
      );

      return yield* applyPart(
        rows.root,
        props.root,
        [...Option.toArray(prompt), markup, notice],
        replacement("root"),
      );
    }),
  /**
   * Rebuild the node with each region's content replaced, in the order `regions` gives them.
   */
  replaceRegions: (interaction, contents) => {
    const [first, ...rest] = contents;
    const prompt = interaction.prompt.pipe(Option.map((nodes) => first ?? nodes));
    const after = Option.isSome(interaction.prompt) ? rest : contents;

    return {
      ...interaction,
      inertTemplates: interaction.inertTemplates.map((nodes, index) => after[index + 1] ?? nodes),
      markup: after[0] ?? interaction.markup,
      prompt,
    };
  },
  /**
   * The stored value as it is: the page shows no value of the response without script, and the
   * frame host (issue pci-04) hands the PCI its state.
   */
  restore: (_interaction, stored) => stored,
  /**
   * No shuffle: a PCI presents no choices plate orders.
   */
  sequence: () => Option.none(),
  /**
   * The correct value as it is, for the hub: the payload never holds it.
   */
  solution: (_interaction, correct) => correct,
  /**
   * The renderer names no Control: it renders none.
   */
  unnamed: () => false,
  /**
   * No message: the response's JSON binding is judged by issue pci-05.
   */
  validate: () => [],
};
