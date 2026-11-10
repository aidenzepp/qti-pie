/**
 * The page side of a Portable Custom Interaction's (Q-16) host (issue pci-04): one sandboxed
 * frame per rendered PCI whose root carries the host facts, the frame's `srcdoc` built from the
 * PCI's transformed markup and one classic script, the frame boot (`frame-boot.dom.ts`), the
 * checked messages between the two, the type-identifier choice, the frame's height, and the
 * teardown that asks the PCI to complete before the frame goes. The protocol both sides speak is
 * `frame-protocol.ts`; the controller in `interactions/portable-custom.dom.ts` calls
 * {@link hostFrame} and nothing else.
 *
 * The facts a root carries (declared by the issue that writes them, `data-pci-loader`,
 * `data-pci-routes` and `data-pci-entry`, beside the core's `data-pci-configuration`,
 * `data-pci-status` and `data-pci-type`) are the SSR's own writing, a render input a host
 * computed, never item data: {@link readHostFacts} reads them as JSON, and a value that is not
 * JSON is a defect of the writer that surfaces as the parse's own error, not a case this module
 * handles. A root with no `data-pci-loader` gets no frame: the upgrade attaches nothing, moves
 * no focus, announces nothing and returns a working teardown (decision D15), which is what the
 * shared runtime tests' bare roots and a host that passed no facts rely on.
 *
 * Trust between the page and its frame: the frame is `sandbox="allow-scripts"` and never
 * `allow-same-origin`, so its origin is opaque and the page cannot reach into it, nor it into the
 * page. The page accepts a message only when `event.source` is that frame's `contentWindow` and
 * the message carries the nonce the page drew for that frame (`crypto.randomUUID()`), written
 * into the `srcdoc` as data the boot reads, never as an executed inline script. What it accepts
 * it re-dispatches as bubbling `CustomEvent`s on the interaction's root ({@link rootEvents}),
 * which issue pci-05 consumes.
 *
 * Decisions this module keeps: the type-identifier rule runs on the page, not in the frame
 * (`factoryFor`, issue pci-01); a route that is not an absolute URL resolves against the page's
 * base URL; the frame's `title` is the Prompt's text, else the root's `aria-label`, else this
 * module's own English sentence (decision D7); the frame's height is its `height` attribute,
 * never an inline `style`; the Notice and the Markup part are hidden with the `hidden` attribute
 * while a frame runs, since the frame shows the markup, and shown again when the frame goes.
 *
 * Stated limits of issue pci-04: the root carries the template and context variables'
 * identifiers only, so the configuration's two variable objects are empty until the issue that
 * reads their values lands; no `boundTo`, no hidden input and no stored state, which issue pci-05
 * adds (the controller re-dispatches the frame's events on the root and writes no input); and no
 * dev page shows a running frame until the dev-host issue passes the facts.
 *
 * @module
 */
import type {
  FrameToPage,
  PageToFrame,
  PciFrameBoot,
  PciFrameConfiguration,
  PciFrameRoute,
} from "#plate/pci/frame-protocol.ts";
import { factoryFor } from "#plate/pci/type-identifier.ts";
import type { Teardown } from "#plate/runtime/contract.dom.ts";

/**
 * The host facts a PCI's root carries, read from its attributes: the loader URL, the routes, and
 * the entry module's id when the PCI names one, each URL made absolute against the page's base.
 */
export interface HostFactsOnRoot {
  readonly entry: string | undefined;
  readonly loader: string;
  readonly routes: readonly PciFrameRoute[];
}

/**
 * The detail of `pci-ready`: the PCI rendered. `choice` is how the factory was chosen
 * (`factoryFor`): `exact` when a registered identifier equals the one written, `only` when none
 * did and one factory registered; `typeIdentifier` is the factory's, `written` the element's.
 * `state` is what the PCI gave `onready`, opaque.
 */
export interface PciReadyDetail {
  readonly choice: "exact" | "only";
  readonly responseIdentifier: string;
  readonly state: unknown;
  readonly typeIdentifier: string;
  readonly written: string;
}

/**
 * The detail of `pci-changed`: the PCI fired `qti-interaction-changed`. `value` is the event's
 * `detail.value`, or the PCI's `getResponse()` when the detail carried none, in the Appendix C
 * JSON binding; `valid` is the detail's, or `undefined` when it carried none.
 */
export interface PciChangedDetail {
  readonly responseIdentifier: string;
  readonly valid: boolean | undefined;
  readonly value: unknown;
}

/**
 * The detail of `pci-done`: the PCI called `ondone`, with the status it gave, or `undefined`.
 */
export interface PciDoneDetail {
  readonly response: unknown;
  readonly responseIdentifier: string;
  readonly state: unknown;
  readonly status: string | undefined;
}

/**
 * The detail of `pci-completed`: the frame ran `getResponse()`, `getState()` and `oncompleted()`
 * for the teardown, and these are the two values; the frame is removed right after.
 */
export interface PciCompletedDetail {
  readonly response: unknown;
  readonly responseIdentifier: string;
  readonly state: unknown;
}

/**
 * The detail of `pci-failed`: the frame cannot serve the PCI (a route exhausted, a thrown error),
 * or no registered factory serves the written type identifier. The Notice is shown again.
 */
export interface PciFailedDetail {
  readonly reason: string;
  readonly responseIdentifier: string;
}

/**
 * The detail of `pci-resized`: the whole pixels the frame's content takes, now the frame's
 * `height` attribute.
 */
export interface PciResizedDetail {
  readonly pixels: number;
}

/**
 * The events the host dispatches on the interaction's root after a message passed the source and
 * nonce checks: bubbling, not composed, not cancelable, each with the detail its type names.
 */
export const rootEvents = {
  changed: "pci-changed",
  completed: "pci-completed",
  done: "pci-done",
  failed: "pci-failed",
  ready: "pci-ready",
  resized: "pci-resized",
} as const;

/**
 * How long the teardown waits for the frame's `completed` reply before it removes the frame
 * anyway, in milliseconds: long enough for a PCI's `oncompleted` to run, short enough that a
 * frame whose script hung does not keep the page's markup.
 */
export const completionGraceMs = 3000;

/**
 * The frame's title when the root has neither a Prompt nor an `aria-label` (decision D7).
 */
const defaultTitle = "Portable custom interaction";

/**
 * The marker of the PCI's Prompt part, whose text names the frame.
 */
const promptSelector = '[data-slot="portable-custom-interaction-prompt"]';

/**
 * The marker of the PCI's Markup part, the element a PCI is handed as its `dom`: the frame shows
 * a copy of it.
 */
const markupSelector = '[data-slot="portable-custom-interaction-markup"]';

/**
 * The marker of the PCI's Notice part, the sentence shown without script.
 */
const noticeSelector = '[data-slot="portable-custom-interaction-notice"]';

/**
 * The root that last hid a Notice, by root: a departing frame shows the Notice again only when no
 * newer frame on the same root has hidden it since, so a second upgrade of a root is independent
 * of the first's teardown.
 */
const owners = new WeakMap<HTMLElement, symbol>();

/**
 * An object whose keys are read one by one at this boundary: what a root's JSON attribute or a
 * frame's message parses to before a predicate has read it.
 */
interface Fields {
  // oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- The parsing boundary: each key is `unknown` until a predicate below has read it, and a browser module may not use Schema to parse it.
  readonly [key: string]: unknown;
}

/**
 * Report whether a value is an object: not null, so its keys can be read.
 *
 * @param node The value.
 * @returns Whether it is a {@link Fields}.
 */
const isObject = (node: unknown): node is Fields => typeof node === "object" && node !== null;

/**
 * Report whether a value is a string.
 *
 * @param node The value.
 * @returns Whether it is.
 */
const isString = (node: unknown): node is string => typeof node === "string";

/**
 * Report whether a value is a finite number.
 *
 * @param node The value.
 * @returns Whether it is.
 */
const isNumber = (node: unknown): node is number =>
  typeof node === "number" && Number.isFinite(node);

/**
 * Report whether a value is a boolean.
 *
 * @param node The value.
 * @returns Whether it is.
 */
const isBoolean = (node: unknown): node is boolean => typeof node === "boolean";

/**
 * Report whether a value is a list of strings.
 *
 * @param node The value.
 * @returns Whether it is.
 */
const isStringList = (node: unknown): node is readonly string[] =>
  Array.isArray(node) && node.every((item) => isString(item));

/**
 * Read a key of an object as a string, `undefined` when it holds none.
 *
 * @param value The object.
 * @param key The key.
 * @returns The string.
 */
const stringAt = (value: Fields, key: string): string | undefined => {
  const field = value[key];

  return isString(field) ? field : undefined;
};

/**
 * Read a key of an object as a finite number, `undefined` when it holds none.
 *
 * @param value The object.
 * @param key The key.
 * @returns The number.
 */
const numberAt = (value: Fields, key: string): number | undefined => {
  const field = value[key];

  return isNumber(field) ? field : undefined;
};

/**
 * Report whether a value is one route as `data-pci-routes` writes it.
 *
 * @param node The value.
 * @returns Whether it is a {@link PciFrameRoute}.
 */
const isRoute = (node: unknown): node is PciFrameRoute => {
  if (!isObject(node) || stringAt(node, "id") === undefined) {
    return false;
  }

  const { fallback, primary, waitSeconds } = node;

  return (
    isObject(waitSeconds) &&
    numberAt(waitSeconds, "primary") !== undefined &&
    numberAt(waitSeconds, "fallback") !== undefined &&
    (primary === undefined || isString(primary)) &&
    (fallback === undefined || isString(fallback))
  );
};

/**
 * Report whether a value is a message the frame sends the page, with the fields the page reads.
 *
 * @param node The value.
 * @returns Whether it is a {@link FrameToPage}.
 */
const isFrameMessage = (node: unknown): node is FrameToPage => {
  if (!isObject(node) || stringAt(node, "nonce") === undefined) {
    return false;
  }

  const kind = stringAt(node, "kind");

  if (kind === undefined) {
    return false;
  }

  switch (kind) {
    case "booted":
    case "ready":
    case "done":
    case "completed": {
      return true;
    }
    case "registered": {
      return isStringList(node["typeIdentifiers"]);
    }
    case "changed": {
      const { valid } = node;

      return (
        stringAt(node, "responseIdentifier") !== undefined &&
        (valid === undefined || isBoolean(valid))
      );
    }
    case "height": {
      return numberAt(node, "pixels") !== undefined;
    }
    case "failed": {
      return stringAt(node, "reason") !== undefined;
    }
    default: {
      return false;
    }
  }
};

/**
 * Make a URL absolute against the page's base URL.
 *
 * @param url The URL as written, absolute or not.
 * @returns The absolute URL, or `undefined` when the text is no URL.
 */
const absolute = (url: string): string | undefined => URL.parse(url, document.baseURI)?.href;

/**
 * A route while its locations are made absolute, each added only when it is one.
 */
interface MutableRoute {
  fallback?: string;
  id: string;
  primary?: string;
  waitSeconds: PciFrameRoute["waitSeconds"];
}

/**
 * Make a route's locations absolute. A location that is no URL is dropped, as if the module had
 * none there.
 *
 * @param route The route as written.
 * @returns The route with absolute locations.
 */
const absoluteRoute = (route: PciFrameRoute): PciFrameRoute => {
  const primary = route.primary === undefined ? undefined : absolute(route.primary);
  const fallback = route.fallback === undefined ? undefined : absolute(route.fallback);
  const made: MutableRoute = { id: route.id, waitSeconds: route.waitSeconds };

  if (primary !== undefined) {
    made.primary = primary;
  }

  if (fallback !== undefined) {
    made.fallback = fallback;
  }

  return made;
};

/**
 * Read the host facts off a PCI's root: `data-pci-loader` (the loader URL), `data-pci-routes`
 * (the routes as JSON) and `data-pci-entry` (the entry module's id). A root with no loader has no
 * facts. A root with a loader and no routes, or routes that are not a list of routes, has a
 * frame that loads nothing.
 *
 * @param root The PCI's root.
 * @returns The facts, or `undefined` when the root carries no loader.
 */
export const readHostFacts = (root: HTMLElement): HostFactsOnRoot | undefined => {
  const written = root.dataset["pciLoader"];
  const loader = written === undefined || written === "" ? undefined : absolute(written);

  if (loader === undefined) {
    return undefined;
  }

  const routesText = root.dataset["pciRoutes"];
  const parsed: unknown = routesText === undefined ? [] : JSON.parse(routesText);
  const routes = Array.isArray(parsed)
    ? parsed.filter((route) => isRoute(route)).map(absoluteRoute)
    : [];
  const entry = root.dataset["pciEntry"];

  return { entry: entry === undefined || entry === "" ? undefined : entry, loader, routes };
};

/**
 * Read the configuration the frame hands the PCI from the root's `data-pci-configuration` (its
 * `properties` by dataset name and its `responseIdentifier`; the `module` and `modules` a core
 * that predates the host facts still writes are ignored) and `data-pci-status`, with the two
 * variable objects empty (a stated limit).
 *
 * @param root The PCI's root.
 * @returns The configuration.
 */
const readConfiguration = (root: HTMLElement): PciFrameConfiguration => {
  const text = root.dataset["pciConfiguration"];
  const parsed: unknown = text === undefined ? {} : JSON.parse(text);
  const written = isObject(parsed) ? parsed["properties"] : undefined;
  const properties: Record<string, string> = {};

  if (isObject(written)) {
    for (const [name, value] of Object.entries(written)) {
      if (isString(value)) {
        properties[name] = value;
      }
    }
  }

  return {
    contextVariables: {},
    properties,
    responseIdentifier:
      (isObject(parsed) ? stringAt(parsed, "responseIdentifier") : undefined) ?? "",
    status: root.dataset["pciStatus"] ?? "interacting",
    templateVariables: {},
  };
};

/**
 * Name the frame: the Prompt's text when the root has one, else the root's `aria-label`, else
 * {@link defaultTitle}.
 *
 * @param root The PCI's root.
 * @returns The title.
 */
const titleOf = (root: HTMLElement): string => {
  const prompt = root.querySelector(promptSelector)?.textContent.trim() ?? "";
  const label = root.getAttribute("aria-label")?.trim() ?? "";

  if (prompt !== "") {
    return prompt;
  }

  return label === "" ? defaultTitle : label;
};

/**
 * Escape text for an HTML text node or a quoted attribute value.
 *
 * @param text The text.
 * @returns The text with `&`, `<`, `>` and `"` as character references.
 */
const escapeHtml = (text: string): string =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/**
 * The data block while it is built, its entry added only when the PCI names one.
 */
interface MutableBoot {
  entry?: string;
  nonce: string;
  routes: readonly PciFrameRoute[];
}

/**
 * Build the frame's document: the PCI's transformed markup as its `dom` (a copy of the Markup
 * part marked `data-pci-dom`), the facts as a JSON data block, and the frame boot as the one
 * classic script, at the end of the body so the `dom` is parsed when it runs. No inline script,
 * no event-handler attribute, no inline style: a page under `script-src 'self'` and `style-src
 * 'self'` refuses them, and the frame inherits the page's policy. The `<` of the JSON is written
 * as `\u003c`, so the data block cannot be closed by what the routes hold.
 *
 * @param root The PCI's root.
 * @param markup The Markup part, or `null` when the root has none.
 * @param facts The host facts.
 * @param nonce The frame's nonce.
 * @returns The `srcdoc`.
 */
const srcdocOf = (
  root: HTMLElement,
  markup: HTMLElement | null,
  facts: HostFactsOnRoot,
  nonce: string,
): string => {
  const copy = markup?.cloneNode(true);
  let dom = '<div data-pci-dom=""></div>';

  if (copy instanceof HTMLElement) {
    copy.dataset["pciDom"] = "";
    dom = copy.outerHTML;
  }

  const lang = root.closest("[lang]")?.getAttribute("lang") ?? "";
  const boot: MutableBoot = { nonce, routes: facts.routes };

  if (facts.entry !== undefined) {
    boot.entry = facts.entry;
  }

  const block: PciFrameBoot = boot;
  const data = JSON.stringify(block).replaceAll("<", String.raw`\u003c`);

  return `<!DOCTYPE html><html${lang === "" ? "" : ` lang="${escapeHtml(lang)}"`}><head><meta charset="utf-8"><title>${escapeHtml(titleOf(root))}</title><script type="application/json" data-pci-boot>${data}</script></head><body>${dom}<script src="${escapeHtml(facts.loader)}"></script></body></html>`;
};

/**
 * The detail of any of the {@link rootEvents}.
 */
type RootDetail =
  | PciChangedDetail
  | PciCompletedDetail
  | PciDoneDetail
  | PciFailedDetail
  | PciReadyDetail
  | PciResizedDetail;

/**
 * Dispatch one of the {@link rootEvents} on a root: bubbling, not composed, not cancelable.
 *
 * @param root The PCI's root.
 * @param name The event's name.
 * @param detail The event's detail.
 */
const dispatch = (root: HTMLElement, name: string, detail: RootDetail): void => {
  root.dispatchEvent(
    new CustomEvent(name, { bubbles: true, cancelable: false, composed: false, detail }),
  );
};

/**
 * Do nothing: the teardown of a root that hosts no frame, and the restore of a part that is not
 * there.
 */
const nothing = (): void => undefined;

/**
 * Hide an element with the `hidden` attribute, and give back what undoes it: the attribute as it
 * was.
 *
 * @param element The element, or `null` for none.
 * @returns The restore.
 */
const hide = (element: HTMLElement | null): (() => void) => {
  if (element === null) {
    return nothing;
  }

  const was = element.hidden;

  element.hidden = true;

  return () => {
    element.hidden = was;
  };
};

/**
 * Host one PCI in its own frame, when its root carries the host facts: build the frame and its
 * `srcdoc`, hide the Notice and the Markup part, accept the frame's messages by source and nonce,
 * choose the factory when the modules registered, re-dispatch the PCI's life as events on the
 * root, follow the frame's height, and, at teardown, ask the frame to complete the PCI and remove
 * the frame when it has, or after {@link completionGraceMs}.
 *
 * A root with no loader fact gets no frame and a teardown that does nothing (decision D15).
 * Upgrading moves no focus and announces nothing: the ready, change and done facts are events,
 * not speech.
 *
 * @param root The PCI's root, `data-slot="portable-custom-interaction"`.
 * @returns The teardown.
 */
export const hostFrame = (root: HTMLElement): Teardown => {
  const facts = readHostFacts(root);

  if (facts === undefined) {
    return nothing;
  }

  const nonce = crypto.randomUUID();
  const written = root.dataset["pciType"] ?? "";
  const configuration = readConfiguration(root);
  const markup = root.querySelector<HTMLElement>(markupSelector);
  const notice = root.querySelector<HTMLElement>(noticeSelector);
  const frame = document.createElement("iframe");
  const token = Symbol("frame");
  const listening = new AbortController();
  const srcdoc = srcdocOf(root, markup, facts, nonce);
  const restoreNotice = hide(notice);
  const restoreMarkup = hide(markup);
  let chosen: { readonly kind: "exact" | "only"; readonly typeIdentifier: string } | undefined;
  let closing = false;
  let removed = false;
  let grace: ReturnType<typeof setTimeout> | undefined;

  owners.set(root, token);

  /**
   * Show the Notice and the Markup part again, when no newer frame on the root hid them since.
   */
  const restore = (): void => {
    if (owners.get(root) === token) {
      owners.delete(root);
      restoreMarkup();
      restoreNotice();
    }
  };

  /**
   * Post a message to the frame. The target origin is `"*"`: the frame's origin is opaque, so
   * nothing else matches.
   *
   * @param message The message, carrying the nonce.
   */
  const tell = (message: PageToFrame): void => {
    frame.contentWindow?.postMessage(message, "*");
  };

  /**
   * Remove the frame and stop listening, once, and show the Notice again.
   */
  const remove = (): void => {
    if (removed) {
      return;
    }

    removed = true;

    if (grace !== undefined) {
      clearTimeout(grace);
    }

    listening.abort();
    frame.remove();
    restore();
  };

  /**
   * Act on the modules' registration: choose the factory, and tell the frame which to
   * instantiate, or show the Notice again when none serves.
   *
   * @param typeIdentifiers What the modules registered.
   */
  const registered = (typeIdentifiers: readonly string[]): void => {
    const choice = factoryFor(written, typeIdentifiers);

    if (choice.kind === "none") {
      restore();
      dispatch(root, rootEvents.failed, {
        reason:
          typeIdentifiers.length === 0
            ? "The interaction's modules registered no factory."
            : `No registered factory serves the type identifier "${written}", and ${String(typeIdentifiers.length)} registered, so none is the only one.`,
        responseIdentifier: configuration.responseIdentifier,
      });

      return;
    }

    chosen = choice;
    tell({
      configuration,
      kind: "instantiate",
      nonce,
      state: undefined,
      typeIdentifier: choice.typeIdentifier,
    });
  };

  /**
   * Act on a message that passed the source and nonce checks.
   *
   * @param message The message.
   */
  const accept = (message: FrameToPage): void => {
    switch (message.kind) {
      case "booted": {
        break;
      }
      case "registered": {
        registered(message.typeIdentifiers);
        break;
      }
      case "ready": {
        if (chosen !== undefined) {
          dispatch(root, rootEvents.ready, {
            choice: chosen.kind,
            responseIdentifier: configuration.responseIdentifier,
            state: message.state,
            typeIdentifier: chosen.typeIdentifier,
            written,
          });
        }

        break;
      }
      case "changed": {
        dispatch(root, rootEvents.changed, {
          responseIdentifier: message.responseIdentifier,
          valid: message.valid,
          value: message.value,
        });
        break;
      }
      case "done": {
        dispatch(root, rootEvents.done, {
          response: message.response,
          responseIdentifier: configuration.responseIdentifier,
          state: message.state,
          status: message.status,
        });
        break;
      }
      case "completed": {
        dispatch(root, rootEvents.completed, {
          response: message.response,
          responseIdentifier: configuration.responseIdentifier,
          state: message.state,
        });

        if (closing) {
          remove();
        }

        break;
      }
      case "height": {
        const pixels = Math.max(0, Math.ceil(message.pixels));

        frame.setAttribute("height", String(pixels));
        dispatch(root, rootEvents.resized, { pixels });
        break;
      }
      case "failed": {
        restore();
        dispatch(root, rootEvents.failed, {
          reason: message.reason,
          responseIdentifier: configuration.responseIdentifier,
        });
        break;
      }
      default: {
        break;
      }
    }
  };

  /**
   * Check a message's source and nonce before acting on it.
   *
   * @param event The message event.
   */
  const onMessage = (event: MessageEvent): void => {
    const data: unknown = event.data;

    if (
      event.source === null ||
      event.source !== frame.contentWindow ||
      !isFrameMessage(data) ||
      data.nonce !== nonce
    ) {
      return;
    }

    accept(data);
  };

  frame.setAttribute("sandbox", "allow-scripts");
  frame.title = titleOf(root);
  frame.srcdoc = srcdoc;
  window.addEventListener("message", onMessage, { signal: listening.signal });

  if (markup === null) {
    root.append(frame);
  } else {
    markup.after(frame);
  }

  return () => {
    if (closing) {
      return;
    }

    closing = true;

    if (chosen === undefined || frame.contentWindow === null) {
      remove();

      return;
    }

    grace = setTimeout(remove, completionGraceMs);
    tell({ kind: "complete", nonce });
  };
};
