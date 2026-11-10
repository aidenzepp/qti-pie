/* oxlint-disable-next-line unicorn/prefer-module -- This file is served as a classic script, not a module (see the module doc), and a classic script is sloppy unless it says otherwise. */
"use strict";

/**
 * The frame side of a Portable Custom Interaction's (Q-16) host (issue pci-04): the one classic
 * script a PCI's sandboxed frame loads. It provides, before any module loads, a small AMD loader
 * (`define` with `define.amd`, anonymous and named defines, dependencies in order, `require`,
 * `exports` and `module` as the three CommonJS-style names) and the `qtiCustomInteractionContext`
 * bridge, both as an AMD module id and as a `window` global; it loads the interaction's modules
 * from the routes the host resolved (issue pci-01's rules), the entry first when the PCI names
 * one, each route's primary location with its wait seconds, then its fallback after a timeout or
 * a fatal error; it reports the type identifiers the modules registered to the page, which
 * chooses the factory and tells the frame which to instantiate; and its bridge calls
 * `factory.getInstance(dom, configuration, state)` and relays `onready`, `ondone` and the
 * `qti-interaction-changed` event to the page through `postMessage`. The protocol is
 * `frame-protocol.ts`.
 *
 * It is a classic script, not a module, because the frame's origin is opaque
 * (`sandbox="allow-scripts"` without `allow-same-origin`): a `<script type="module">` is fetched
 * in CORS mode with `Origin: null`, which the servers that serve it refuse, while a classic
 * `<script src>` needs no CORS. A classic script can hold no `import` or `export`, so this file
 * has no import at all and no export: not even `import type`, because the transform that serves
 * it keeps a module a module by appending `export {}` once it has erased the type imports, and
 * a classic script cannot parse that line. The protocol's types are therefore restated below,
 * each mirroring its declaration in `frame-protocol.ts`, which the page side imports; a change
 * to one is a change to both. A classic script is sloppy by default and the PCI contract wants
 * strict code, so `"use strict"` is its first statement. Its names live on `window` and in this
 * file's scope.
 *
 * The frame reads its facts from the `<script type="application/json">` data block the page wrote
 * into the `srcdoc` (`PciFrameBoot`), which no policy executes, and finds the PCI's `dom` by the
 * `data-pci-dom` attribute the page put on the copy of the Markup part. It posts to
 * `window.parent` with the target origin `"*"`, since an opaque frame cannot name the page's
 * origin, and accepts a message only from `window.parent` carrying its nonce.
 *
 * The frame's height follows its content: a `ResizeObserver` on the document's root element
 * posts the whole pixels the root takes, and the page writes them as the frame's `height`
 * attribute. No inline style, inline script or event-handler attribute appears here or in the
 * `srcdoc`: a page under `script-src 'self'` and `style-src 'self'` refuses them, and a `srcdoc`
 * frame inherits its parent's policy.
 *
 * Failure travels as a `failed` message, never as a thrown error the page cannot see: a route that
 * exhausts its locations, a module that names a dependency no route defines, no factory for the
 * identifier the page chose, or an uncaught error in the frame, which the `error` and
 * `unhandledrejection` events of the window deliver here.
 *
 * Stated limits of issue pci-04: the template and context variables arrive as empty objects (the
 * root carries identifiers only, and the issue that reads their values fills them); no `boundTo`
 * and no stored state, which issue pci-05 adds; and the frame's own English sentences live here
 * (decision D7).
 *
 * @module
 * @see https://github.com/amdjs/amdjs-api/blob/master/AMD.md (the `define` the loader provides)
 * @see https://html.spec.whatwg.org/multipage/scripting.html#data-block (a data block is not executed)
 */
/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-unknown-returns, anti-slop/no-unknown-type-aliases, anti-slop/no-unsafe-dictionary-type -- This script is the boundary between the host and a PCI's own code: what an AMD module exports, what a factory is handed and what a PCI returns as its state and its response are opaque to the host by the PCI contract, and a classic script with no imports has no Schema to parse them with, so `unknown` is their honest type here. */

/**
 * One route the page resolved, mirroring `PciFrameRoute` in `frame-protocol.ts`.
 */
interface PciFrameRoute {
  readonly fallback?: string;
  readonly id: string;
  readonly primary?: string;
  readonly waitSeconds: { readonly fallback: number; readonly primary: number };
}

/**
 * The facts the page writes into the frame's data block, mirroring `PciFrameBoot` in
 * `frame-protocol.ts`.
 */
interface PciFrameBoot {
  readonly entry?: string;
  readonly nonce: string;
  readonly routes: readonly PciFrameRoute[];
}

/**
 * A JSON value, mirroring `PciJsonValue` in `frame-protocol.ts`.
 */
type PciJsonValue = boolean | number | string | null | readonly PciJsonValue[] | PciJsonObject;

/**
 * A JSON object, mirroring `PciJsonObject` in `frame-protocol.ts`.
 */
interface PciJsonObject {
  readonly [key: string]: PciJsonValue;
}

/**
 * The configuration the page builds for `getInstance`, less the two callbacks the bridge adds,
 * mirroring `PciFrameConfiguration` in `frame-protocol.ts`.
 */
interface PciFrameConfiguration {
  readonly contextVariables: PciJsonObject;
  readonly properties: Readonly<Record<string, string>>;
  readonly responseIdentifier: string;
  readonly status: string;
  readonly templateVariables: PciJsonObject;
}

/**
 * The page's choice of factory, mirroring `PageInstantiate` in `frame-protocol.ts`.
 */
interface PageInstantiate {
  readonly configuration: PciFrameConfiguration;
  readonly kind: "instantiate";
  readonly nonce: string;
  readonly state: unknown;
  readonly typeIdentifier: string;
}

/**
 * The page's request to complete, mirroring `PageComplete` in `frame-protocol.ts`.
 */
interface PageComplete {
  readonly kind: "complete";
  readonly nonce: string;
}

/**
 * What the page sends the frame, mirroring `PageToFrame` in `frame-protocol.ts`.
 */
type PageToFrame = PageComplete | PageInstantiate;

/**
 * What the frame sends the page, mirroring `FrameToPage` in `frame-protocol.ts`: each carries
 * the nonce.
 */
type FrameToPage =
  | { readonly kind: "booted"; readonly nonce: string }
  | {
      readonly kind: "registered";
      readonly nonce: string;
      readonly typeIdentifiers: readonly string[];
    }
  | { readonly kind: "ready"; readonly nonce: string; readonly state: unknown }
  | {
      readonly kind: "changed";
      readonly nonce: string;
      readonly responseIdentifier: string;
      readonly valid: boolean | undefined;
      readonly value: unknown;
    }
  | {
      readonly kind: "done";
      readonly nonce: string;
      readonly response: unknown;
      readonly state: unknown;
      readonly status: string | undefined;
    }
  | {
      readonly kind: "completed";
      readonly nonce: string;
      readonly response: unknown;
      readonly state: unknown;
    }
  | { readonly kind: "height"; readonly nonce: string; readonly pixels: number }
  | { readonly kind: "failed"; readonly nonce: string; readonly reason: string };

/**
 * Any function a PCI's code hands the loader or the bridge: an AMD factory, a `require` callback,
 * a PCI object's method.
 */
type Callable = (...parameters: unknown[]) => unknown;

/**
 * A PCI object, as `getInstance` returns it: the two readers the host calls, and the optional
 * `oncompleted` the host MUST call before the frame goes.
 */
interface PciInstance {
  readonly getResponse: () => unknown;
  readonly getState: () => unknown;
  readonly oncompleted?: () => void;
}

/**
 * The configuration the bridge hands `getInstance`: the page's, with the bridge's own `onready`
 * and `ondone`.
 */
interface GivenConfiguration extends PciFrameConfiguration {
  readonly ondone: (
    interaction: PciInstance,
    response: unknown,
    state: unknown,
    status?: string,
  ) => void;
  readonly onready: (interaction: PciInstance, state: unknown) => void;
}

/**
 * A factory a PCI module registers with the bridge: its `typeIdentifier` and the `getInstance`
 * that renders one PCI into a `dom`.
 */
interface PciFactory {
  readonly getInstance: (
    dom: HTMLElement,
    configuration: GivenConfiguration,
    state: unknown,
  ) => PciInstance;
  readonly typeIdentifier: string;
}

/**
 * The `qtiCustomInteractionContext` bridge: `register`, which a PCI module calls once per type in
 * this frame, and `getInstance`, which the host calls to render the chosen factory's PCI.
 */
interface Bridge {
  readonly getInstance: (
    typeIdentifier: string,
    dom: HTMLElement,
    configuration: GivenConfiguration,
    state: unknown,
  ) => PciInstance | undefined;
  readonly register: (factory: unknown) => void;
}

/**
 * The AMD `define`: `(factory)`, `(dependencies, factory)`, `(id, factory)` or `(id,
 * dependencies, factory)`, with `define.amd` present so a module knows an AMD loader is here.
 */
interface AmdDefine {
  (first: unknown, second?: unknown, third?: unknown): void;
  readonly amd: Readonly<Record<string, never>>;
}

/**
 * The `module` a factory may ask for, whose `exports` it may fill or replace.
 */
interface ModuleRecord {
  exports: unknown;
}

/**
 * One defined module, not yet run: its dependency ids and its factory, or the value it defines
 * when the factory is not a function.
 */
interface AmdDefinition {
  readonly dependencies: readonly string[];
  readonly factory: unknown;
}

/**
 * What loading one location, or one route, came to.
 */
type Outcome = { readonly kind: "loaded" } | { readonly kind: "failed"; readonly reason: string };

/**
 * What resolving a module id came to: its exported value, or the first dependency no route
 * defines, with the module that asked for it.
 */
type Resolution =
  | { readonly kind: "resolved"; readonly value: unknown }
  | { readonly kind: "missing"; readonly id: string; readonly from: string };

/**
 * The route whose script is loading now, if any: an anonymous `define` is this module's, and an
 * uncaught error while it loads is this location's failure.
 */
interface Loading {
  readonly id: string;
  readonly settle: (outcome: Outcome) => void;
}

declare global {
  interface Window {
    define?: AmdDefine;
    qtiCustomInteractionContext?: Bridge;
  }
}

/**
 * The AMD module id of the bridge, which a PCI module names in its dependencies.
 */
const bridgeId = "qtiCustomInteractionContext";

/**
 * The dependencies an AMD factory with parameters and no dependency list gets, by the AMD
 * specification's CommonJS wrapping.
 */
const commonJsNames = ["require", "exports", "module"] as const;

/**
 * The attribute the page puts on the frame's copy of the Markup part, the element a PCI is handed
 * as its `dom`.
 */
const domSelector = "[data-pci-dom]";

/**
 * The data block the page wrote the frame's facts into.
 */
const bootSelector = 'script[type="application/json"][data-pci-boot]';

/**
 * An object whose keys are read one by one at this boundary: what a data block, a message or a
 * PCI's event detail parses to before a predicate has read it.
 */
interface Fields {
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
 * Report whether a value is a function.
 *
 * @param node The value.
 * @returns Whether it is.
 */
const isCallable = (node: unknown): node is Callable => typeof node === "function";

/**
 * Report whether a value is a list of strings.
 *
 * @param node The value.
 * @returns Whether it is.
 */
const isStringList = (node: unknown): node is readonly string[] =>
  Array.isArray(node) && node.every((item) => isString(item));

/**
 * Read a key of an object, `undefined` when the object has no such key.
 *
 * @param value The object.
 * @param key The key.
 * @returns The value under the key.
 */
const fieldAt = (value: Fields, key: string): unknown => value[key];

/**
 * Read a key of an object as a string, `undefined` when it holds none.
 *
 * @param value The object.
 * @param key The key.
 * @returns The string.
 */
const stringAt = (value: Fields, key: string): string | undefined => {
  const field = fieldAt(value, key);

  return isString(field) ? field : undefined;
};

/**
 * Report whether a value is one route of the data block.
 *
 * @param node The value.
 * @returns Whether it is a {@link PciFrameRoute}.
 */
const isRoute = (node: unknown): node is PciFrameRoute => {
  if (!isObject(node) || stringAt(node, "id") === undefined) {
    return false;
  }

  const waitSeconds = fieldAt(node, "waitSeconds");
  const primary = fieldAt(node, "primary");
  const fallback = fieldAt(node, "fallback");

  return (
    isObject(waitSeconds) &&
    isNumber(fieldAt(waitSeconds, "primary")) &&
    isNumber(fieldAt(waitSeconds, "fallback")) &&
    (primary === undefined || isString(primary)) &&
    (fallback === undefined || isString(fallback))
  );
};

/**
 * Report whether a value is the data block the page writes.
 *
 * @param node The value.
 * @returns Whether it is a {@link PciFrameBoot}.
 */
const isBoot = (node: unknown): node is PciFrameBoot => {
  if (!isObject(node) || stringAt(node, "nonce") === undefined) {
    return false;
  }

  const routes = fieldAt(node, "routes");
  const entry = fieldAt(node, "entry");

  return (
    Array.isArray(routes) &&
    routes.every((route) => isRoute(route)) &&
    (entry === undefined || isString(entry))
  );
};

/**
 * Report whether a value is a message the page sends this frame.
 *
 * @param node The value.
 * @returns Whether it is a {@link PageToFrame}.
 */
const isPageMessage = (node: unknown): node is PageToFrame => {
  if (!isObject(node) || stringAt(node, "nonce") === undefined) {
    return false;
  }

  const kind = stringAt(node, "kind");

  if (kind === "complete") {
    return true;
  }

  return (
    kind === "instantiate" &&
    stringAt(node, "typeIdentifier") !== undefined &&
    isObject(fieldAt(node, "configuration"))
  );
};

/**
 * Report whether a value a module registered is a factory the bridge can serve.
 *
 * @param node The value.
 * @returns Whether it is a {@link PciFactory}.
 */
const isFactory = (node: unknown): node is PciFactory =>
  isObject(node) &&
  stringAt(node, "typeIdentifier") !== undefined &&
  isCallable(fieldAt(node, "getInstance"));

/**
 * Report whether a value a factory returned is a PCI object the host can complete.
 *
 * @param node The value.
 * @returns Whether it is a {@link PciInstance}.
 */
const isInstance = (node: unknown): node is PciInstance =>
  isObject(node) &&
  isCallable(fieldAt(node, "getResponse")) &&
  isCallable(fieldAt(node, "getState"));

/**
 * Give one sentence for an uncaught rejection's reason.
 *
 * @param cause The rejection's reason.
 * @returns The sentence.
 */
const reasonText = (cause: unknown): string => {
  if (cause instanceof Error) {
    return cause.message;
  }

  return isString(cause)
    ? cause
    : "A script in the frame failed with a value that is not an error.";
};

/**
 * Read the frame's facts from the data block the page wrote.
 *
 * @returns The facts, or `undefined` when the block is absent or not what the page writes.
 */
const readBoot = (): PciFrameBoot | undefined => {
  const block = document.querySelector(bootSelector);
  const parsed: unknown = block === null ? undefined : JSON.parse(block.textContent);

  return isBoot(parsed) ? parsed : undefined;
};

/**
 * The frame's facts. Without them nothing runs: there is no nonce to answer with.
 */
const boot = readBoot();

/**
 * The frame's nonce, which every message carries.
 */
const nonce = boot === undefined ? "" : boot.nonce;

/**
 * The element a PCI is handed as its `dom`: the frame's copy of the Markup part.
 */
const dom = document.querySelector<HTMLElement>(domSelector);

/**
 * The modules defined so far, by id, each not yet run.
 */
const definitions = new Map<string, AmdDefinition>();

/**
 * The value each run module exported, by id.
 */
const exported = new Map<string, unknown>();

/**
 * The loader's built-in modules, by id: the bridge and `require`, filled once both exist.
 */
const builtins = new Map<string, unknown>();

/**
 * The factories the modules registered, in registration order.
 */
const factories: PciFactory[] = [];

/**
 * The route whose script is loading now.
 */
let loading: Loading | undefined;

/**
 * The PCI object once the page's chosen factory rendered it.
 */
let instance: PciInstance | undefined;

/**
 * The response identifier the page configured the PCI with, for a change event whose detail
 * names none.
 */
let responseIdentifier = "";

/**
 * Post a message to the page. The target origin is `"*"`: the page's origin is unknown to an
 * opaque frame, and the page accepts only by source and nonce.
 *
 * @param message The message, carrying the nonce.
 */
const post = (message: FrameToPage): void => {
  window.parent.postMessage(message, "*");
};

/**
 * Give up on the PCI: tell the page why.
 *
 * @param reason One sentence.
 */
const fail = (reason: string): void => {
  post({ kind: "failed", nonce, reason });
};

/**
 * Run a module and every dependency it names, once, and give its exported value.
 *
 * `qtiCustomInteractionContext` and `require` are the loader's own; `exports` and `module` are
 * fresh per module, and a factory that returns nothing exports its `exports`. A dependency cycle
 * resolves to `undefined`, as AMD has it.
 *
 * @param id The module id.
 * @param chain The ids being resolved above this one, outermost first.
 * @returns The module's value, or the first dependency no route defined.
 */
const resolveModule = (id: string, chain: readonly string[]): Resolution => {
  if (builtins.has(id)) {
    return { kind: "resolved", value: builtins.get(id) };
  }

  if (exported.has(id)) {
    return { kind: "resolved", value: exported.get(id) };
  }

  if (chain.includes(id)) {
    return { kind: "resolved", value: undefined };
  }

  const definition = definitions.get(id);

  if (definition === undefined) {
    return { from: chain.at(-1) ?? "", id, kind: "missing" };
  }

  const next = [...chain, id];
  const moduleRecord: ModuleRecord = { exports: {} };
  const dependencies: unknown[] = [];

  for (const dependency of definition.dependencies) {
    if (dependency === "exports") {
      dependencies.push(moduleRecord.exports);
    } else if (dependency === "module") {
      dependencies.push(moduleRecord);
    } else {
      const resolved = resolveModule(dependency, next);

      if (resolved.kind === "missing") {
        return resolved;
      }

      dependencies.push(resolved.value);
    }
  }

  const returned = isCallable(definition.factory)
    ? definition.factory(...dependencies)
    : definition.factory;
  const value = returned === undefined ? moduleRecord.exports : returned;

  exported.set(id, value);

  return { kind: "resolved", value };
};

/**
 * The loader's `require`: one id gives its module's value at once; a list of ids runs the callback
 * with their values. Every module is already loaded by the time a factory runs, so both are
 * synchronous.
 *
 * @param ids One id or a list of ids.
 * @param onResolved The callback a list of ids is given to.
 * @returns The one module's value, or `undefined` for a list or a module no route defined.
 */
const requireModule = (ids: unknown, onResolved?: unknown): unknown => {
  if (isString(ids)) {
    const resolved = resolveModule(ids, []);

    return resolved.kind === "resolved" ? resolved.value : undefined;
  }

  if (isStringList(ids) && isCallable(onResolved)) {
    const values = ids.map((id) => {
      const resolved = resolveModule(id, []);

      return resolved.kind === "resolved" ? resolved.value : undefined;
    });

    onResolved(...values);
  }

  return undefined;
};

/**
 * The AMD `define` this frame provides. An anonymous define belongs to the route whose script is
 * loading; one outside any load has no id to be known by and is dropped. A factory with
 * parameters and no dependency list gets `require`, `exports` and `module`.
 */
const define: AmdDefine = Object.assign(
  (first: unknown, second?: unknown, third?: unknown): void => {
    const named = isString(first);
    const id = named ? first : loading?.id;
    const afterId = named ? second : first;
    const last = named ? third : second;
    const listed = isStringList(afterId);
    const factory = listed ? last : afterId;
    const wrapped = isCallable(factory) && factory.length > 0;
    const dependencies = listed ? afterId : [];

    if (id === undefined) {
      return;
    }

    definitions.set(id, {
      dependencies: dependencies.length === 0 && wrapped ? commonJsNames : dependencies,
      factory,
    });
  },
  { amd: {} },
);

/**
 * The `qtiCustomInteractionContext` bridge of this frame.
 */
const bridge: Bridge = {
  getInstance: (typeIdentifier, element, configuration, state) =>
    factories
      .find((factory) => factory.typeIdentifier === typeIdentifier)
      ?.getInstance(element, configuration, state),
  register: (factory) => {
    if (isFactory(factory)) {
      factories.push(factory);
    }
  },
};

/**
 * Load one script and wait for it to define its module: the location is loaded when the module
 * is defined by the time the script ran; it fails when the script does not load, when an
 * uncaught error is reported while it loads, or when the wait runs out before a define comes
 * (an empty script loads and defines nothing, so the wait runs out). A wait of 0 is no limit.
 *
 * @param id The route's module id, which an anonymous define takes.
 * @param url The script's absolute URL.
 * @param waitSeconds How long to wait, 0 for no limit.
 * @returns How the load came out.
 */
const loadLocation = (id: string, url: string, waitSeconds: number): Promise<Outcome> => {
  const { promise, resolve } = Promise.withResolvers<Outcome>();
  const script = document.createElement("script");
  let timer: ReturnType<typeof setTimeout> | undefined;
  let settled = false;
  const settle = (outcome: Outcome): void => {
    if (settled) {
      return;
    }

    settled = true;

    if (timer !== undefined) {
      clearTimeout(timer);
    }

    if (loading?.settle === settle) {
      loading = undefined;
    }

    resolve(outcome);
  };

  loading = { id, settle };
  script.addEventListener("error", () => {
    settle({ kind: "failed", reason: `The module script at ${url} did not load.` });
  });
  script.addEventListener("load", () => {
    if (definitions.has(id)) {
      settle({ kind: "loaded" });
    }
  });

  if (waitSeconds > 0) {
    timer = setTimeout(() => {
      settle({
        kind: "failed",
        reason: `The module script at ${url} defined no module "${id}" within ${String(waitSeconds)} seconds.`,
      });
    }, waitSeconds * 1000);
  }

  script.src = url;
  document.head.append(script);

  return promise;
};

/**
 * Load one route: its primary location, then its fallback when the primary fails. A route with
 * no location loads nothing and is not a failure; a route with no fallback has no second chance.
 *
 * @param route The route.
 * @returns How the route came out.
 */
const loadRoute = async (route: PciFrameRoute): Promise<Outcome> => {
  const primary =
    route.primary === undefined
      ? undefined
      : await loadLocation(route.id, route.primary, route.waitSeconds.primary);

  if (primary?.kind === "loaded" || route.fallback === undefined) {
    return primary ?? { kind: "loaded" };
  }

  return await loadLocation(route.id, route.fallback, route.waitSeconds.fallback);
};

/**
 * Load some routes in order, one at a time, stopping at the first that fails.
 *
 * @param routes The routes.
 * @returns Loaded, or the first failure.
 */
const loadRoutes = async (routes: readonly PciFrameRoute[]): Promise<Outcome> => {
  const [first, ...rest] = routes;

  if (first === undefined) {
    return { kind: "loaded" };
  }

  const outcome = await loadRoute(first);

  if (outcome.kind === "failed") {
    return outcome;
  }

  return await loadRoutes(rest);
};

/**
 * Run the loaded modules: the entry alone when the PCI names one, else every route's module that
 * is defined, in route order. The modules register their factories as they run.
 *
 * @param facts The frame's facts.
 * @returns The first dependency no route defined, or `undefined` when every module ran.
 */
const runModules = (facts: PciFrameBoot): Resolution | undefined => {
  const ids =
    facts.entry === undefined
      ? facts.routes.map((route) => route.id).filter((id) => definitions.has(id))
      : [facts.entry];

  return ids.map((id) => resolveModule(id, [])).find((resolution) => resolution.kind === "missing");
};

/**
 * Relay the PCI's `qti-interaction-changed`: the event's `detail.value` when it carries one, else
 * the interaction's `getResponse()`; `valid` when the detail carries it.
 *
 * @param event The event, fired at the `dom`.
 */
const onChanged = (event: Event): void => {
  const detail: unknown = event instanceof CustomEvent ? event.detail : undefined;
  const given = isObject(detail) ? fieldAt(detail, "interaction") : undefined;
  const interaction = isInstance(given) ? given : instance;

  if (interaction === undefined) {
    return;
  }

  const valid = isObject(detail) ? fieldAt(detail, "valid") : undefined;
  const value =
    isObject(detail) && "value" in detail ? fieldAt(detail, "value") : interaction.getResponse();

  post({
    kind: "changed",
    nonce,
    responseIdentifier:
      (isObject(detail) ? stringAt(detail, "responseIdentifier") : undefined) ?? responseIdentifier,
    valid: isBoolean(valid) ? valid : undefined,
    value,
  });
};

/**
 * Render the PCI the page chose: the bridge calls the factory's `getInstance` with the page's
 * configuration, the bridge's `onready` and `ondone`, and the page's state.
 *
 * @param message The page's choice.
 */
const instantiate = (message: PageInstantiate): void => {
  if (dom === null) {
    fail("The frame holds no element to hand the interaction as its dom.");

    return;
  }

  const configuration: GivenConfiguration = {
    ...message.configuration,
    ondone: (_interaction, response, state, status) => {
      post({ kind: "done", nonce, response, state, status });
    },
    onready: (_interaction, state) => {
      post({ kind: "ready", nonce, state });
    },
  };
  ({ responseIdentifier } = message.configuration);

  const made = bridge.getInstance(message.typeIdentifier, dom, configuration, message.state);

  if (!isInstance(made)) {
    fail(
      `No registered factory serves the type identifier "${message.typeIdentifier}", or its getInstance returned no interaction.`,
    );

    return;
  }

  instance = made;
};

/**
 * Complete the PCI before the page removes the frame: `getResponse()`, then `getState()`, then
 * `oncompleted()` when the PCI has one, and answer with the two values.
 */
const complete = (): void => {
  if (instance === undefined) {
    post({ kind: "completed", nonce, response: undefined, state: undefined });

    return;
  }

  const response = instance.getResponse();
  const state = instance.getState();

  if (instance.oncompleted !== undefined) {
    instance.oncompleted();
  }

  post({ kind: "completed", nonce, response, state });
};

/**
 * Act on a message from the page: only one from the parent window carrying this frame's nonce.
 *
 * @param event The message event.
 */
const onMessage = (event: MessageEvent): void => {
  const data: unknown = event.data;

  if (event.source !== window.parent || !isPageMessage(data) || data.nonce !== nonce) {
    return;
  }

  if (data.kind === "instantiate") {
    instantiate(data);
  } else {
    complete();
  }
};

/**
 * Report the height the document's root element takes, in whole pixels.
 */
const reportHeight = (): void => {
  post({
    kind: "height",
    nonce,
    pixels: Math.ceil(document.documentElement.getBoundingClientRect().height),
  });
};

/**
 * Load the routes and run the modules, then tell the page what they registered.
 *
 * @param facts The frame's facts.
 */
const start = async (facts: PciFrameBoot): Promise<void> => {
  post({ kind: "booted", nonce });

  const entryFirst = [
    ...facts.routes.filter((route) => route.id === facts.entry),
    ...facts.routes.filter((route) => route.id !== facts.entry),
  ];
  const outcome = await loadRoutes(entryFirst);

  if (outcome.kind === "failed") {
    fail(outcome.reason);

    return;
  }

  const missing = runModules(facts);

  if (missing !== undefined && missing.kind === "missing") {
    fail(
      missing.from === ""
        ? `The entry module "${missing.id}" was not defined by any route.`
        : `The module "${missing.from}" depends on "${missing.id}", which no route defines.`,
    );

    return;
  }

  post({
    kind: "registered",
    nonce,
    typeIdentifiers: factories.map((factory) => factory.typeIdentifier),
  });
};

if (boot !== undefined) {
  builtins.set(bridgeId, bridge);
  builtins.set("require", requireModule);
  window.define = define;
  window.qtiCustomInteractionContext = bridge;
  window.addEventListener("error", (event: ErrorEvent) => {
    const reason = event.message === "" ? "A script in the frame threw." : event.message;

    if (loading === undefined) {
      fail(reason);
    } else {
      loading.settle({ kind: "failed", reason });
    }
  });
  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    fail(reasonText(event.reason));
  });
  window.addEventListener("message", onMessage);
  dom?.addEventListener("qti-interaction-changed", onChanged);
  new ResizeObserver(reportHeight).observe(document.documentElement);
  void start(boot);
}
