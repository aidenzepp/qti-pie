/**
 * Package and resource metadata (P-5, P-6, P-7, M-1 to M-10), a stub: `openPackage` gives each
 * `PackageResource` its {@link ResourceMetadata} through {@link resourceMetadataOf}, which reads
 * nothing yet. Issue m3f-04 fills it with the LOM and the QTI metadata the resource's manifest
 * entry writes, as typed read-only data a host shows or filters on; plate interprets none of it.
 *
 * @module
 */
import type { SourceDocument } from "#plate/document/source.ts";
import type { LomGeneral, ManifestResource } from "#plate/package/manifest.ts";

/**
 * What `openPackage` hands {@link resourceMetadataOf} for one resource: its manifest entry, the
 * LOM generals the manifest reader read of it, and the manifest's document, so the reader of issue
 * m3f-04 reaches whatever else the entry writes.
 */
export interface MetadataContext {
  readonly lom: readonly LomGeneral[];
  readonly manifest: SourceDocument;
  readonly resource: ManifestResource;
}

/**
 * The metadata a resource's manifest entry writes, as a host reads it. A stub: issue m3f-04 fills
 * its fields with the LOM record and the `qtiMetadata` the entry holds; until then every resource's
 * is empty.
 */
export interface ResourceMetadata {
  /**
   * The `general` categories of the entry's LOM records, in document order; empty until issue
   * m3f-04 reads them.
   */
  readonly lom: readonly LomGeneral[];
}

/**
 * Read a resource's metadata: empty until issue m3f-04 reads the manifest entry.
 *
 * @param _context The resource's manifest entry, its LOM generals and the manifest.
 * @returns Empty metadata.
 */
export const resourceMetadataOf = (_context: MetadataContext): ResourceMetadata => ({ lom: [] });
