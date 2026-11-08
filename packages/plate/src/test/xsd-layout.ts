/**
 * Where each XSD plate's tests and scripts read sits in the XSD cache, `~/.cache/gr8des/qti3/xsd/`,
 * in the layout pantry's `fetch-xsds` writes, with the purl URL it is published at and its SHA-256.
 *
 * The paths, URLs and digests are those of `packages/pantry/src/vocab/derive/sources.ts` at
 * `bjornpagen/qti-pie@48c2ac88` (PR #46), for the files plate reads: the QTI 3.0 ASI XSD and the
 * usage data XSD, which that list also pins, are never read here and are left out. The Results
 * Reporting XSD, which that list does not pin, is added at the cache's top. When that list is
 * re-pinned, this table follows it.
 *
 * The ASI, metadata, content-packaging and Results XSDs sit at the cache's top. Every other file
 * sits in its publisher's folder: `cpext/`, `csm/`, `drd/`, `lom/`, `xlink/`, `w3/`, and `mathml/`
 * and `ssml/`, whose entry files sit beside the files they include.
 *
 * Test support, and a leaf module: it imports nothing of plate's. The XSD oracle's catalog
 * (`src/test/xsd.ts`) and the package-tables generator (`scripts/package-tables.ts`) map each purl
 * location through this table, so neither reaches a file it does not list.
 *
 * @module
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown. */
import { mkdir, mkdtemp, rm, symlink } from "node:fs/promises";
import path from "node:path";
import { Config, Effect, Schema } from "effect";
import type { Scope } from "effect";

/**
 * One cached XSD: the URL it is published at, which is the location the XSDs that import it name,
 * and the SHA-256 of its bytes, as 64 lower-case hex digits.
 */
export interface CachedXsd {
  readonly sha256: string;
  readonly url: string;
}

/**
 * Every XSD plate's tests and scripts read, keyed by its path under the XSD cache.
 */
export const cachedXsds = {
  "cpext/imsqtiv3p0_cpextv1p2_v1p0.xsd": {
    sha256: "3f8deb01dd5ac3ad4b81522e159650c01b3dfe199cae6a6be7e87487e790ad85",
    url: "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqtiv3p0_cpextv1p2_v1p0.xsd",
  },
  "cpext/imsqtiv3p0p1_cpextv1p2_v1p0.xsd": {
    sha256: "e2f7511da9d99152a88e255cc89ea7f65150a3ab0232c6d69aa4c2194245866f",
    url: "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqtiv3p0p1_cpextv1p2_v1p0.xsd",
  },
  "csm/imsqtiv3p0_csmv1p1_v1p0.xsd": {
    sha256: "caa7ddf900afa66fd5efb212a8834b42480f675de092ae927ce0c95b74443d2e",
    url: "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqtiv3p0_csmv1p1_v1p0.xsd",
  },
  "csm/imsqtiv3p0p1_csmv1p1_v1p0.xsd": {
    sha256: "2d7d76a165a13065f9c3b3e5fa63ae0a6c31132ac32f1c1402a5f34f59c26f98",
    url: "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqtiv3p0p1_csmv1p1_v1p0.xsd",
  },
  "drd/imsqtiv3p0_afa3p0drd_v1p0.xsd": {
    sha256: "dd3822a3fe0f42af9a25b33be56d11d1a1f3c54ea791bcc355965ceb8f41b064",
    url: "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqtiv3p0_afa3p0drd_v1p0.xsd",
  },
  "drd/imsqtiv3p0p1_afa3p0drd_v1p0.xsd": {
    sha256: "5057bc38307c4a182cf6b2ccc1297474f6001470d7d4342567eab59b19ed2906",
    url: "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqtiv3p0p1_afa3p0drd_v1p0.xsd",
  },
  "imsqti_asiv3p0p1_v1p0.xsd": {
    sha256: "bd82f6df3c7acec951fffc78548325a01e9e9bc91d5768d7415bdcbdc018341d",
    url: "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd",
  },
  "imsqti_metadatav3p0_v1p0.xsd": {
    sha256: "448c18d65607695d2a60ce96c42003df98f28630fb044ca14ccc609bad384c8b",
    url: "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_metadatav3p0_v1p0.xsd",
  },
  "imsqti_resultv3p0_v1p0.xsd": {
    sha256: "8cf1d3c89cbb1f198691410598ac4f8755a3b3ee6c1459747c3548fa6ccdc509",
    url: "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_resultv3p0_v1p0.xsd",
  },
  "imsqtiv3p0_imscpv1p2_v1p0.xsd": {
    sha256: "30be3dad4fe0ee103295268317ee0ff2b1826b8b55023db974a993edf3ce9101",
    url: "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqtiv3p0_imscpv1p2_v1p0.xsd",
  },
  "imsqtiv3p0p1_imscpv1p2_v1p0.xsd": {
    sha256: "cc59960859c6c84b85b9a8611cca8b6149c8758976fce21f3d346fc3acbd4a90",
    url: "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqtiv3p0p1_imscpv1p2_v1p0.xsd",
  },
  "lom/imsmd_loose_v1p3p2.xsd": {
    sha256: "1ae9e77aba63b6789574631213c97fd00a3d43aeffb58050ac7befb665fba9f6",
    url: "https://purl.imsglobal.org/spec/md/v1p3/schema/xsd/imsmd_loose_v1p3p2.xsd",
  },
  "mathml/mathml3-common.xsd": {
    sha256: "94007301de9c8ed29ffed4a5eba6ca6b1e2e7511eda8d2b39e01b97d7d7e5d06",
    url: "https://purl.imsglobal.org/spec/mathml/v3p0/schema/xsd/mathml3-common.xsd",
  },
  "mathml/mathml3-content.xsd": {
    sha256: "922b4082d00559df86b0389842b1d1ba9537db0050ab229d64ad313ddfb44098",
    url: "https://purl.imsglobal.org/spec/mathml/v3p0/schema/xsd/mathml3-content.xsd",
  },
  "mathml/mathml3-presentation.xsd": {
    sha256: "74d605b09528b7c55a4ae803debc429c27a2afa6cd34607d28df79bcc7f3575b",
    url: "https://purl.imsglobal.org/spec/mathml/v3p0/schema/xsd/mathml3-presentation.xsd",
  },
  "mathml/mathml3-strict-content.xsd": {
    sha256: "cd0da554afbe2d1570c4e548a29ee5eb0b25aea1d6455bacf664080cb5982640",
    url: "https://purl.imsglobal.org/spec/mathml/v3p0/schema/xsd/mathml3-strict-content.xsd",
  },
  "mathml/mathml3.xsd": {
    sha256: "af49edc2c29c4976d6a9d8860388c026b94ca75edfbd67bbaf67448da9990656",
    url: "https://purl.imsglobal.org/spec/mathml/v3p0/schema/xsd/mathml3.xsd",
  },
  "ssml/ssmlv1p1-core.xsd": {
    sha256: "f5e6d5ca575722c5ee1de50aefbe483bb8c88d2c46e65f4d7eecb713b8c1f485",
    url: "https://purl.imsglobal.org/spec/ssml/v1p1/schema/xsd/ssmlv1p1-core.xsd",
  },
  "ssml/synthesis-nonamespace.xsd": {
    sha256: "10608b0b9ad809f78be41e84c655d210fcf27ccc84996ef97cd6dc80b00ace5c",
    url: "https://purl.imsglobal.org/spec/ssml/v1p1/schema/xsd/synthesis-nonamespace.xsd",
  },
  "w3/XInclude.xsd": {
    sha256: "b72e1d2a0ab90aca502b827ce12572bfb4ef787fee89b4dcc1ce474dd3c00df0",
    url: "https://purl.imsglobal.org/spec/w3/2001/schema/xsd/XInclude.xsd",
  },
  "w3/xml.xsd": {
    sha256: "4c637d0381d988dbf24b680becde6e1c8301b4c4ceef8bfa45a1ee130e77a682",
    url: "https://purl.imsglobal.org/spec/w3/2001/schema/xsd/xml.xsd",
  },
  "xlink/xlink.xsd": {
    sha256: "e49074eafa608cbf3bc01c2de3406781d466f6ae6adbb90f26cc450d5bf02a1c",
    url: "https://purl.imsglobal.org/spec/w3/1999/schema/xsd/xlink.xsd",
  },
} as const satisfies Readonly<Record<string, CachedXsd>>;

/**
 * The path of a cached XSD under the XSD cache.
 */
export type XsdPath = keyof typeof cachedXsds;

/**
 * Tell whether a path names a cached XSD.
 *
 * @param file A path under the XSD cache.
 * @returns Whether {@link cachedXsds} lists it.
 */
export const isXsdPath = (file: string): file is XsdPath => Object.hasOwn(cachedXsds, file);

/**
 * The paths of the cached XSDs, in the order {@link cachedXsds} lists them.
 */
export const xsdPaths: readonly XsdPath[] = Object.keys(cachedXsds).filter(isXsdPath);

/**
 * Each cached XSD's path, by the URL it is published at.
 */
export const xsdPathByUrl: ReadonlyMap<string, XsdPath> = new Map(
  xsdPaths.map((file) => [cachedXsds[file].url, file] as const),
);

/**
 * The failure to build a home folder of linked XSDs under `TMPDIR`.
 *
 * `directory` is the `TMPDIR` it built under, and `detail` the operating system's reason.
 */
export class LayoutUnlinkable extends Schema.TaggedError<LayoutUnlinkable>()("LayoutUnlinkable", {
  detail: Schema.String,
  directory: Schema.String,
}) {
  /**
   * The directory, the reason, and the setting to change.
   */
  override get message(): string {
    return `cannot link the cached XSDs into a home folder under ${this.directory}: ${this.detail}. Set TMPDIR to a writable directory that can hold symbolic links; plate's test script sets it to work/.vp-tmp.`;
  }
}

/**
 * Build a home folder whose XSD cache holds exactly the given files, each at its path under
 * `.cache/gr8des/qti3/xsd/` as a symbolic link to the file at the same path under `cache`.
 *
 * Nothing is copied and nothing under `cache` is written. The home is made fresh under the test's
 * `TMPDIR` and removed, links and all, when the caller's scope closes.
 *
 * @param cache The XSD cache the links point into, such as the real one under `HOME`.
 * @param files The paths to link.
 * @returns The home folder; {@link LayoutUnlinkable} when it cannot be built, and a `ConfigError`
 *   when `TMPDIR` is unset or empty.
 */
export const linkedHome = Effect.fnUntraced(function* linkedHome(
  cache: string,
  files: readonly XsdPath[],
): Effect.fn.Return<string, LayoutUnlinkable | Config.ConfigError, Scope.Scope> {
  const scratch = yield* Config.NonEmptyString("TMPDIR");
  /**
   * Construct the failure of a step under the scratch directory from what it rejected with.
   *
   * @param cause What the step rejected with.
   * @returns The failure.
   */
  const unlinkable = (cause: unknown) =>
    new LayoutUnlinkable({
      detail: cause instanceof Error ? cause.message : String(cause),
      directory: scratch,
    });
  const home = yield* Effect.acquireRelease(
    Effect.tryPromise({
      catch: unlinkable,
      try: () => mkdtemp(path.join(scratch, "plate-xsd-home-")),
    }),
    (made) => Effect.ignore(Effect.tryPromise(() => rm(made, { force: true, recursive: true }))),
  );
  const directory = path.join(home, ".cache", "gr8des", "qti3", "xsd");

  for (const file of files) {
    const link = path.join(directory, file);

    yield* Effect.tryPromise({
      catch: unlinkable,
      try: () => mkdir(path.dirname(link), { recursive: true }),
    });
    yield* Effect.tryPromise({
      catch: unlinkable,
      try: () => symlink(path.join(cache, file), link),
    });
  }

  return home;
});
