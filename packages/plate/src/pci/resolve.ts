/**
 * Module resolution for a portable custom interaction (issue pci-01, a server module):
 * {@link resolvePciModules} says, for one PCI in an opened package, where each of its AMD modules
 * loads from, the primary and the fallback URL of every module with its timeouts, and a typed
 * {@link PciNotice} for each route that cannot resolve. The frame host (issue pci-04) consumes the
 * {@link PciResolution}; nothing here loads or fetches a URL.
 *
 * The QTI 3 module-resolution rules, from the implementation guide and the information model: a
 * PCI names its module with the `module` attribute or lists its modules in
 * `qti-interaction-modules`, whose `primary-configuration` (default
 * `modules/module_resolution.js`) and `secondary-configuration` (default
 * `modules/fallback_module_resolution.js`) name two configuration files, and whose
 * `qti-interaction-module` children each carry an `id` and may carry a `primary-path` and a
 * `fallback-path`. A module `N` loads from its own `primary-path` when written, else from
 * `paths[N]` of the primary configuration; on a timeout or a fatal error it loads from its own
 * `fallback-path` when written, else from `paths[N]` of the secondary configuration. A
 * configuration file is a JSON document despite its `.js` name: `waitSeconds`, how long to wait
 * for each file before falling back (default 7; 0 is no timeout), and `paths`, module name to
 * location without a file extension, to which `.js` is appended. A location that starts with a
 * protocol is fetched from there; any other is a path relative to the content package's base. A
 * delivery engine may ignore a package-relative location the manifest does not list, and may apply
 * security rules to the URLs it loads script from.
 *
 * Reading 11 binds the attribute names: **A PCI's secondary module configuration is
 * `secondary-configuration`.** An item writing `fallback-configuration` is refused before it
 * reaches here, and that attribute is never read.
 *
 * Where the sources are silent, these defaults apply, each named where it is applied:
 *
 * - **R1** `.js` is appended to a location unless it already ends in `.js`, so it is never doubled.
 * - **R2** A configuration file absent from the package contributes no path and no notice; one
 *   present but not a JSON object with an object `paths` gives `pci-configuration-invalid` and
 *   contributes nothing.
 * - **R3** The timeout is the primary configuration's `waitSeconds` for primary loads and the
 *   secondary's for fallback loads, 7 when absent.
 * - **R4** A module with no primary location gives `pci-module-unresolved`; one with no fallback has
 *   none, it simply has no second chance.
 * - **R5** A package-relative location the manifest does not list is kept and gives
 *   `pci-module-unlisted`; an absolute location is kept only for `https:`, and any other scheme
 *   gives `pci-module-insecure` and is dropped.
 * - **R6** Without `module`, every listed module is loaded, and the frame takes as the factory the
 *   one module that registers.
 *
 * (R7, the type-identifier rule, is `pci/type-identifier.ts`'s, since it runs in the frame.)
 *
 * @module
 */
import { Option, Result, Schema } from "effect";

/**
 * The module facts of one `qti-portable-custom-interaction`, as written: its `module` attribute,
 * the `primary-configuration` and `secondary-configuration` of its `qti-interaction-modules`, and
 * each `qti-interaction-module` child's `id`, `primary-path` and `fallback-path`. Issue pci-03's
 * model maps onto it. A default the schema gives an absent attribute is applied here, not by the
 * caller, so every field is the attribute as written.
 */
export interface PciModules {
  readonly module: Option.Option<string>;
  readonly modules: readonly {
    readonly fallbackPath: Option.Option<string>;
    readonly id: string;
    readonly primaryPath: Option.Option<string>;
  }[];
  readonly primaryConfiguration: Option.Option<string>;
  readonly secondaryConfiguration: Option.Option<string>;
}

/**
 * Where one AMD module loads from.
 *
 * `primary` and `fallback` are URLs: absolute `https:` URLs, or paths relative to the package's
 * base, each ending in `.js` exactly once (R1). `fallback` is tried after `primary` times out or
 * fails fatally; a module with none has no second chance (R4). `waitSeconds` is how long each
 * load waits before the host gives up on it, 0 for no timeout (R3).
 */
export interface ModuleRoute {
  readonly fallback: Option.Option<string>;
  readonly id: string;
  readonly primary: Option.Option<string>;
  readonly waitSeconds: { readonly fallback: number; readonly primary: number };
}

/**
 * One PCI's resolved modules: what the frame host loads, and what could not be resolved.
 */
export interface PciResolution {
  /**
   * The module the PCI names with `module`, the one the host requires first; none when the PCI
   * lists its modules without naming one, and every listed module is loaded (R6).
   */
  readonly entry: Option.Option<string>;
  /**
   * The routes of every module the PCI names: the entry first when it is written, then the listed
   * modules in their order, each id once. A name the configurations map that the PCI does not
   * name is not routed.
   */
  readonly routes: readonly ModuleRoute[];
  /**
   * The notices, in order: the primary configuration's, the secondary's, then each route's in
   * route order (its primary location's, its fallback location's, then `pci-module-unresolved`).
   */
  readonly notices: readonly PciNotice[];
}

/**
 * Why a module's route is incomplete or suspect, for the frame host to show or log.
 *
 * `pci-configuration-invalid` (R2) names a configuration `file` the package holds that is not a
 * JSON object with an object `paths` of string locations and, when written, a non-negative
 * finite `waitSeconds`. `pci-module-unresolved` (R4) names a module with no primary location.
 * `pci-module-unlisted` (R5) names a module and its package-relative `location`, kept though the
 * manifest does not list it. `pci-module-insecure` (R5) names a module and its absolute
 * `location`, dropped because its scheme is not `https:`.
 */
export type PciNotice =
  | { readonly kind: "pci-configuration-invalid"; readonly file: string }
  | { readonly kind: "pci-module-insecure"; readonly id: string; readonly location: string }
  | { readonly kind: "pci-module-unlisted"; readonly id: string; readonly location: string }
  | { readonly kind: "pci-module-unresolved"; readonly id: string };

/**
 * The schema's default for `qti-interaction-modules@primary-configuration`, read when the PCI
 * writes none.
 */
export const defaultPrimaryConfiguration = "modules/module_resolution.js";

/**
 * The schema's default for `qti-interaction-modules@secondary-configuration`, read when the PCI
 * writes none.
 */
export const defaultSecondaryConfiguration = "modules/fallback_module_resolution.js";

/**
 * The `waitSeconds` of a configuration that writes none, and of an absent or invalid
 * configuration (R3).
 */
export const defaultWaitSeconds = 7;

/**
 * A configuration file's content, after R2 and R3: the locations by module name and the timeout.
 */
interface Configuration {
  readonly paths: ReadonlyMap<string, string>;
  readonly waitSeconds: number;
}

/**
 * The configuration an absent or invalid file contributes: no path, the default timeout.
 */
const emptyConfiguration: Configuration = { paths: new Map(), waitSeconds: defaultWaitSeconds };

/**
 * A configuration file as read: its content after R2 and R3, and the notice R2 gives.
 */
interface ReadConfiguration {
  readonly configuration: Configuration;
  readonly notices: readonly PciNotice[];
}

/**
 * A module's location placed as a URL, or dropped, with the notices R5 gives.
 */
interface PlacedLocation {
  readonly notices: readonly PciNotice[];
  readonly url: Option.Option<string>;
}

/**
 * One module routed, with its notices.
 */
interface RoutedModule {
  readonly notices: readonly PciNotice[];
  readonly route: ModuleRoute;
}

/**
 * The listed module facts of one id: the `qti-interaction-module` child of that `id`.
 */
type ListedModule = PciModules["modules"][number];

/**
 * The shape a configuration file must have (R2): a JSON object with an object `paths` of string
 * locations and, when written, a non-negative finite `waitSeconds`. Any other member, such as
 * RequireJS's `baseUrl` or `shim`, is passed over.
 */
const ConfigurationFile = Schema.Struct({
  paths: Schema.Record(Schema.String, Schema.String),
  waitSeconds: Schema.optionalKey(Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0))),
});

/**
 * Decode a configuration file's text as {@link ConfigurationFile}.
 */
const decodeConfiguration = Schema.decodeUnknownResult(Schema.fromJsonString(ConfigurationFile));

/**
 * A location that starts with a protocol: an RFC 3986 scheme and its colon.
 *
 * @see https://www.rfc-editor.org/rfc/rfc3986#section-3.1
 */
const schemePrefix = /^[A-Za-z][A-Za-z0-9+.-]*:/u;

/**
 * The one scheme an absolute location may have (R5), compared without case as RFC 3986 section
 * 3.1 compares schemes.
 */
const securePrefix = /^https:/iu;

/**
 * Read a configuration file from the package (R2, R3).
 *
 * @param file The file's package-relative path, as written or defaulted.
 * @param files The package's files, by path.
 * @returns The configuration, with `pci-configuration-invalid` when the file is held but is not a
 *   configuration; the empty configuration and no notice when the package holds no such file.
 */
const readConfiguration = (
  file: string,
  files: (path: string) => Option.Option<string>,
): ReadConfiguration =>
  Option.match(files(file), {
    onNone: () => ({ configuration: emptyConfiguration, notices: [] }),
    onSome: (text) =>
      Result.match(decodeConfiguration(text), {
        onFailure: () => ({
          configuration: emptyConfiguration,
          notices: [{ file, kind: "pci-configuration-invalid" }],
        }),
        onSuccess: (decoded) => ({
          configuration: {
            paths: new Map(Object.entries(decoded.paths)),
            waitSeconds: decoded.waitSeconds ?? defaultWaitSeconds,
          },
          notices: [],
        }),
      }),
  });

/**
 * Append `.js` to a location that does not already end in it (R1).
 *
 * @param location The location, as a configuration or a module attribute writes it.
 * @returns The location ending in `.js` once.
 */
const withScriptSuffix = (location: string): string =>
  location.endsWith(".js") ? location : `${location}.js`;

/**
 * Turn a module's location into the URL the host loads, by R1 and R5.
 *
 * @param id The module's id, for the notices.
 * @param location The location, when the module has one.
 * @param listed Whether the manifest lists a package-relative path.
 * @returns The URL, dropped for an absolute location whose scheme is not `https:`, with the
 *   notices R5 gives.
 */
const placeLocation = (
  id: string,
  location: Option.Option<string>,
  listed: (path: string) => boolean,
): PlacedLocation =>
  Option.match(location, {
    onNone: () => ({ notices: [], url: Option.none() }),
    onSome: (written) => {
      const url = withScriptSuffix(written);

      if (schemePrefix.test(url)) {
        return securePrefix.test(url)
          ? { notices: [], url: Option.some(url) }
          : { notices: [{ id, kind: "pci-module-insecure", location: url }], url: Option.none() };
      }

      return {
        notices: listed(url) ? [] : [{ id, kind: "pci-module-unlisted", location: url }],
        url: Option.some(url),
      };
    },
  });

/**
 * Find a module's location: its own path when the PCI lists one and writes it, else the
 * configuration's `paths` entry for its id.
 *
 * @param id The module's id.
 * @param own The module's own `primary-path` or `fallback-path`, when the PCI lists it and
 *   writes the attribute.
 * @param configuration The configuration that stands in for it.
 * @returns The location, none when neither names one.
 */
const locationOf = (
  id: string,
  own: Option.Option<string>,
  configuration: Configuration,
): Option.Option<string> =>
  Option.orElse(own, () => Option.fromNullishOr(configuration.paths.get(id)));

/**
 * Route one module: its own paths first, else the configurations' (R3, R4).
 *
 * @param id The module's id.
 * @param written The module's `qti-interaction-module`, when the PCI lists one.
 * @param primary The primary configuration.
 * @param secondary The secondary configuration.
 * @param listed Whether the manifest lists a package-relative path.
 * @returns The route and its notices: the primary location's, the fallback location's, then
 *   `pci-module-unresolved` when no primary URL remains.
 */
const routeModule = (
  id: string,
  written: Option.Option<ListedModule>,
  primary: Configuration,
  secondary: Configuration,
  listed: (path: string) => boolean,
): RoutedModule => {
  const own = Option.match(written, {
    onNone: () => ({ fallbackPath: Option.none<string>(), primaryPath: Option.none<string>() }),
    onSome: (module) => ({ fallbackPath: module.fallbackPath, primaryPath: module.primaryPath }),
  });
  const placedPrimary = placeLocation(id, locationOf(id, own.primaryPath, primary), listed);
  const placedFallback = placeLocation(id, locationOf(id, own.fallbackPath, secondary), listed);

  return {
    notices: [
      ...placedPrimary.notices,
      ...placedFallback.notices,
      ...(Option.isNone(placedPrimary.url) ? [{ id, kind: "pci-module-unresolved" } as const] : []),
    ],
    route: {
      fallback: placedFallback.url,
      id,
      primary: placedPrimary.url,
      waitSeconds: { fallback: secondary.waitSeconds, primary: primary.waitSeconds },
    },
  };
};

/**
 * Resolve where each module of one PCI loads from, by the module-resolution rules and the
 * defaults R1 to R6 the module doc states.
 *
 * The routes cover the module the PCI names with `module` and every module it lists, each id
 * once, the entry first; a module named by `module` alone takes its locations from the
 * configurations. Both configuration files are read from the package by their written or default
 * paths, never fetched: one named by an absolute URL is not held, so it contributes nothing, as an
 * absent file does. Paths reach `files` and `listed` as the document writes them, with `.js`
 * appended; normalising them is the caller's, which holds the package.
 *
 * @param modules The interaction's module facts, as written.
 * @param files Read a package-relative file: its text, none when the package holds no such file.
 * @param listed Whether the manifest lists a package-relative path.
 * @returns The entry, the routes and the notices.
 */
export const resolvePciModules = (
  modules: PciModules,
  files: (path: string) => Option.Option<string>,
  listed: (path: string) => boolean,
): PciResolution => {
  const primary = readConfiguration(
    Option.getOrElse(modules.primaryConfiguration, () => defaultPrimaryConfiguration),
    files,
  );
  const secondary = readConfiguration(
    Option.getOrElse(modules.secondaryConfiguration, () => defaultSecondaryConfiguration),
    files,
  );
  const ids = [
    ...new Set([...Option.toArray(modules.module), ...modules.modules.map((module) => module.id)]),
  ];
  const routed = ids.map((id) =>
    routeModule(
      id,
      Option.fromNullishOr(modules.modules.find((module) => module.id === id)),
      primary.configuration,
      secondary.configuration,
      listed,
    ),
  );

  return {
    entry: modules.module,
    notices: [
      ...primary.notices,
      ...secondary.notices,
      ...routed.flatMap((module) => module.notices),
    ],
    routes: routed.map((module) => module.route),
  };
};
