/**
 * What an import would read, without the database: the package read into rows and judged by the
 * guards, and nothing written.
 *
 * The import (`#pantry/import/package.ts`) reads through {@link readImport}, so a dry run reads
 * exactly what an import writes. Nothing here reaches the author login
 * (`#pantry/schema/logins.ts`), whose workload grizzle builds when that module is evaluated, so a
 * dry run never pays for it; `src/cli/startup.test.ts` holds this module to that.
 */
import type { Uuid } from "@bjornpagen/grizzle";
import { Effect, Option } from "effect";
import type { PlatformError } from "effect";
import { externalRows } from "#pantry/import/external.ts";
import { guards } from "#pantry/import/guards.ts";
import { itemRows } from "#pantry/import/item.ts";
import { manifestRows } from "#pantry/import/manifest.ts";
import { outcomeRows } from "#pantry/import/outcome.ts";
import { packageStage } from "#pantry/import/reference.ts";
import type { StagedDocument } from "#pantry/import/reference.ts";
import { ruleOfError } from "#pantry/import/refusal.ts";
import { rptemplateRows } from "#pantry/import/rptemplate.ts";
import { stimulusRows } from "#pantry/import/stimulus.ts";
import { testRows } from "#pantry/import/test.ts";
import { Rows, UnmodeledVocabulary, kindOf } from "#pantry/import/tree.ts";
import { usageRows } from "#pantry/import/usage.ts";
import { listPackage, readEntry } from "#pantry/package/read.ts";
import { ResourceLomGeneral } from "#pantry/schema/lang.ts";
import type { NodeKindHandle, RootKindHandle, SchemaVersionHandle } from "#pantry/schema/node.ts";
import { rootOfType } from "#pantry/schema/seed/root-of-type.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";

/**
 * Whether `error` is one the guards or the reader raised, as opposed to the platform's.
 *
 * It narrows whatever union reaches it, so a refusal a later slice adds to {@link ruleOfError}'s
 * parameter flows to {@link ruleOfError} with no edit here.
 */
const isReadRefusal = <E extends { readonly _tag: string }>(
  error: E,
): error is Exclude<E, PlatformError.PlatformError> => error._tag !== "PlatformError";

/**
 * The root kind a resource type lists its documents under, none for a type `RootOfType` does not
 * hold.
 */
const rootKindOfType = (type: string): RootKindHandle | undefined =>
  rootOfType.find((entry) => entry.type === type)?.root;

/**
 * What {@link documentRows} needs to know about one listed document.
 */
export interface DocumentInput {
  readonly doc: XmlDocument;
  readonly packageId: Uuid;
  readonly path: string;
  readonly resource: string;
  /**
   * Whether the manifest's LOM record for this resource has a `general` category, as the manifest
   * pass found it.
   */
  readonly resourceLomHasGeneral: boolean;
  readonly resourceType: string;
  readonly version: SchemaVersionHandle;
}

/**
 * The builder a document goes to.
 */
export type Route =
  | "external"
  | "item"
  | "outcomes"
  | "rptemplate"
  | "stimulus"
  | "test"
  | "unmodeled"
  | "usage";

/**
 * The builder each root kind goes to, for a document that is not of an `rptemplate` type.
 */
const rootRoutes: ReadonlyMap<string, Route> = new Map<string, Route>([
  ["lom:lom", "external"],
  ["qti-assessment-item", "item"],
  ["qti-assessment-section", "test"],
  ["qti-assessment-stimulus", "stimulus"],
  ["qti-assessment-test", "test"],
  ["qti-outcome-declaration", "outcomes"],
  ["ud:usageData", "usage"],
]);

/**
 * Choose the builder of one document, from the root element's kind and the resource type.
 *
 * A resource type whose root kind is `rptemplate` goes to `rptemplate` whatever its root, so a new
 * `rptemplate` type reaches it with no edit here. Then the root decides: an item root to `item`, a
 * test or section root to `test`, a stimulus root to `stimulus`, an outcome declaration to
 * `outcomes`, `lom:lom` to `external`, `ud:usageData` to `usage`. A file of the `qtiusagedata/xml`
 * type whose root no kind names goes to `usage`, so that a root outside QTI 3 usage data is
 * `NotQti3`. Any other root is `unmodeled`.
 *
 * @param root - The kind of the document's root element, `undefined` when no registry names it.
 * @param resourceType - The manifest's type for the resource.
 * @returns The route.
 */
export const routeOf = (root: NodeKindHandle | undefined, resourceType: string): Route => {
  if (rootKindOfType(resourceType) === "rptemplate") {
    return "rptemplate";
  }

  const named = rootRoutes.get(root ?? "");

  if (named !== undefined) {
    return named;
  }

  return root === undefined && resourceType === "qtiusagedata/xml" ? "usage" : "unmodeled";
};

/**
 * Write the rows of one document the manifest lists, by the builder {@link routeOf} names: the
 * `rptemplate` family by its resource type, every other document by the root element the file
 * holds. `qti-assessment-test` and `qti-assessment-section` go to `testRows`,
 * `qti-assessment-stimulus` to `stimulusRows`, `qti-assessment-item` to `itemRows`,
 * `qti-outcome-declaration` to `outcomeRows`, `lom:lom` to `externalRows`, and `ud:usageData` to
 * `usageRows`. A `qti-response-processing` root listed under a type other than an `rptemplate`
 * one, and a root no builder names, is `UnmodeledVocabulary`. A root that does not belong to its
 * type is refused at commit by the `Document` containment into `RootOfType`.
 *
 * @param input - The decoded document and where its package lists it.
 * @param rows - The rows so far.
 * @returns The rows with the document's added.
 */
export const documentRows = Effect.fn("import.documentRows")(function* documentRows(
  input: DocumentInput,
  rows: Rows,
) {
  const { doc } = input;
  const listed = {
    package: input.packageId,
    path: input.path,
    resource: input.resource,
    resourceType: input.resourceType,
    version: input.version,
  };
  const root = Option.getOrUndefined(kindOf(doc.root, Option.none()));

  const route = routeOf(root, input.resourceType);

  if (route === "rptemplate") {
    return yield* rptemplateRows(input, rows);
  }

  if (route === "item") {
    return yield* itemRows(input, rows);
  }

  if (route === "test") {
    return yield* testRows(input, rows);
  }

  if (route === "stimulus") {
    return yield* stimulusRows(input, rows);
  }

  if (route === "external") {
    return yield* externalRows(doc, listed, rows);
  }

  if (route === "usage") {
    return yield* usageRows(doc, listed, rows);
  }

  if (route === "outcomes") {
    return yield* outcomeRows(input, rows);
  }

  return yield* new UnmodeledVocabulary({
    kind: "element",
    name: doc.root.qname,
    parent: Option.none(),
  });
});

/**
 * Read the package at `dir` into rows and judge them, without the database: the manifest's, then
 * every document it lists, each built by {@link documentRows}, then the tree, manifest, item,
 * content, processing, usage and wildcard guards.
 */
export const readRows = Effect.fn("import.readRows")(function* readRows(dir: string) {
  const entries = yield* listPackage(dir);
  const manifest = yield* readXml(yield* readEntry(dir, "imsmanifest.xml"));
  const built = yield* manifestRows(dir, entries, manifest, Rows.empty());
  let { rows } = built;
  const decoded: StagedDocument[] = [];

  for (const document of built.documents) {
    const doc = yield* readXml(yield* readEntry(dir, document.path));
    const item = yield* documentRows(
      {
        doc,
        packageId: built.packageId,
        path: document.path,
        resource: document.resource,
        resourceLomHasGeneral: Rows.of(built.rows, ResourceLomGeneral).some(
          (general) => general.resource === document.resource,
        ),
        resourceType: document.type,
        version: built.version,
      },
      rows,
    );
    ({ rows } = item);
    decoded.push({ doc, nodes: item.nodes });
  }

  rows = yield* packageStage(rows, decoded);

  yield* guards(rows, entries);

  return { packageId: built.packageId, rows };
});

/**
 * Read the package at `dir` as an import reads it: {@link readRows}, with a refusal of a guard or
 * of the reader failing as the `ImportRefused` that names its rule.
 *
 * @param dir - The package directory or `.zip` file.
 * @returns The package's id and its rows. Fails with `ImportRefused` naming the rule a guard or the
 *   reader refused the package under, and with the platform's error when the package cannot be
 *   read.
 */
export const readImport = (dir: string) =>
  readRows(dir).pipe(Effect.catchIf(isReadRefusal, (refusal) => Effect.fail(ruleOfError(refusal))));

/**
 * How much a package holds: the facts it would write and the relations they fall in.
 */
export interface Preview {
  /**
   * The relations that hold at least one fact, as `changeSetOf` counts them.
   */
  readonly relations: number;
  /**
   * The facts of every relation together.
   */
  readonly rows: number;
}

/**
 * Read the package at `dir` as `importPackage` does and count what it would write, without opening
 * the database. The database's own checks, the laws it applies at commit, do not run, so a package
 * this accepts can still be refused by an import.
 *
 * @param dir - The package directory or `.zip` file.
 * @returns The counts. Fails with `ImportRefused` naming the rule a guard or the reader refused the
 *   package under, and with the platform's error when the package cannot be read.
 */
export const previewPackage = Effect.fn("import.previewPackage")(function* previewPackage(
  dir: string,
) {
  const { rows } = yield* readImport(dir);
  const sizes = [...rows.values()].map((facts) => facts.length);

  return {
    relations: sizes.filter((size) => size > 0).length,
    rows: sizes.reduce((total, size) => total + size, 0),
  } satisfies Preview;
});
