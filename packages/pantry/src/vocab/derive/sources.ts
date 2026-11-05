/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
/**
 * The XSD files the vocabulary deriver reads, pinned by URL and SHA-256, and the reads that refuse
 * any file the pin does not describe.
 *
 * The files are downloaded once into the shared cache `~/.cache/gr8des/qti3/xsd/`, never into the
 * repository: the two ASI XSDs alone are 37 MB. A file is located by its path under that directory,
 * which keeps the publisher's folders (`mathml/`, `ssml/`, `w3/`). Every read hashes the bytes
 * before parsing them, so a derivation runs only over the exact files the pin names, and a file
 * that changed upstream or in the cache is refused rather than read.
 *
 * The pins were taken on 2026-11-05 from the URLs below, each of which answered 200 with the cached
 * file's length. `w3/XInclude.xsd` is published in UTF-16 with a byte-order mark; crust's `readXml`
 * decodes it as any other file.
 */
import { Config, Effect, FileSystem, Schema } from "effect";
import type { PlatformError } from "effect";
import { Digest } from "effect/crypto";
import { readXml } from "@qti-pie/crust/read.ts";
import type { ReaderRefusal, WellFormednessError } from "@qti-pie/crust/errors.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";

/**
 * One pinned XSD: where it was published and the SHA-256 of its bytes, as 64 lower-case hex digits.
 */
export interface XsdSource {
  readonly sha256: string;
  readonly url: string;
}

/**
 * The 14 pinned XSDs, keyed by their path under {@link xsdDirectory}.
 *
 * The QTI 3.0 and 3.0.1 ASI and content-packaging XSDs and the QTI metadata XSD, with the MathML 3,
 * SSML 1.1, `xml.xsd` and XInclude schemas the ASI XSDs import, at the locations the ASI XSDs'
 * `xs:import` elements name. MathML's and SSML's entry files include their siblings by relative
 * path, so the siblings are pinned at the same folder.
 */
export const sources = {
  "imsqti_asiv3p0_v1p0.xsd": {
    sha256: "01290bee61a090fa83d2d313f6821156eac9364a7a1f99caa21b1e8fbe0e8bac",
    url: "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd",
  },
  "imsqti_asiv3p0p1_v1p0.xsd": {
    sha256: "bd82f6df3c7acec951fffc78548325a01e9e9bc91d5768d7415bdcbdc018341d",
    url: "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd",
  },
  "imsqti_metadatav3p0_v1p0.xsd": {
    sha256: "448c18d65607695d2a60ce96c42003df98f28630fb044ca14ccc609bad384c8b",
    url: "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_metadatav3p0_v1p0.xsd",
  },
  "imsqtiv3p0_imscpv1p2_v1p0.xsd": {
    sha256: "30be3dad4fe0ee103295268317ee0ff2b1826b8b55023db974a993edf3ce9101",
    url: "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqtiv3p0_imscpv1p2_v1p0.xsd",
  },
  "imsqtiv3p0p1_imscpv1p2_v1p0.xsd": {
    sha256: "cc59960859c6c84b85b9a8611cca8b6149c8758976fce21f3d346fc3acbd4a90",
    url: "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqtiv3p0p1_imscpv1p2_v1p0.xsd",
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
} as const satisfies Readonly<Record<string, XsdSource>>;

/**
 * The path of a pinned XSD under {@link xsdDirectory}.
 */
export type SourcePath = keyof typeof sources;

/**
 * Whether a path names a pinned XSD.
 *
 * @param path - A path under {@link xsdDirectory}.
 * @returns Whether {@link sources} pins it.
 */
const isSourcePath = (path: string): path is SourcePath => Object.hasOwn(sources, path);

/**
 * The paths of the 14 pinned XSDs, in the order {@link sources} lists them.
 */
export const sourcePaths: readonly SourcePath[] = Object.keys(sources).filter(isSourcePath);

/**
 * The cache directory the pinned XSDs are read from: `.cache/gr8des/qti3/xsd` under `HOME`.
 */
export const xsdDirectory = Config.NonEmptyString("HOME").pipe(
  Config.map((home) => `${home}/.cache/gr8des/qti3/xsd`),
);

/**
 * One pinned XSD that is not in the cache directory: its path under the directory and the URL it
 * is published at.
 */
const MissingSource = Schema.Struct({ path: Schema.String, url: Schema.String });

/**
 * One or more pinned XSDs are not in the cache directory.
 *
 * `missing` lists each absent file with the URL to download it from.
 */
export class XsdSourceMissing extends Schema.TaggedError<XsdSourceMissing>()("XsdSourceMissing", {
  directory: Schema.String,
  missing: Schema.Array(MissingSource),
}) {
  /**
   * Which files are absent, where they belong and where each is published.
   */
  override get message(): string {
    const files = this.missing.map(({ path, url }) => `${path} (${url})`).join(", ");

    return `${this.missing.length} of the ${sourcePaths.length} pinned XSDs are not in ${this.directory}: ${files}. Download each once from its URL into that directory, keeping its path.`;
  }
}

/**
 * A cached XSD's bytes do not hash to its pin.
 *
 * `expected` is the pinned SHA-256 and `actual` the digest of the bytes read.
 */
export class XsdSourceMismatch extends Schema.TaggedError<XsdSourceMismatch>()(
  "XsdSourceMismatch",
  { actual: Schema.String, expected: Schema.String, path: Schema.String, url: Schema.String },
) {
  /**
   * Which file differs from its pin, by how much, and the two ways to settle it.
   */
  override get message(): string {
    return `The cached ${this.path} has SHA-256 ${this.actual}, not the pinned ${this.expected}. Download it again from ${this.url}; if the published file itself changed, re-pin it in src/vocab/derive/sources.ts and re-run the deriver's tests.`;
  }
}

/**
 * Fail unless every pinned XSD is in the cache directory.
 *
 * Only presence is checked, so the cost is one `stat` per file; a present file's content is checked
 * when it is read.
 *
 * @returns Nothing when all 14 files are present, else an {@link XsdSourceMissing} naming each
 *   absent one.
 */
export const checkCache = Effect.fn("vocab.checkCache")(function* checkCache(): Effect.fn.Return<
  void,
  XsdSourceMissing | PlatformError.PlatformError | Config.ConfigError,
  FileSystem.FileSystem
> {
  const fs = yield* FileSystem.FileSystem;
  const directory = yield* xsdDirectory;
  const missing = yield* Effect.filter(
    sourcePaths,
    (path) => fs.exists(`${directory}/${path}`).pipe(Effect.map((present) => !present)),
    { concurrency: "unbounded" },
  );

  if (missing.length > 0) {
    yield* new XsdSourceMissing({
      directory,
      missing: missing.map((path) => ({ path, url: sources[path].url })),
    });
  }
});

/**
 * Check bytes against a pinned XSD's SHA-256.
 *
 * @param path - The pinned file the bytes were read as.
 * @param bytes - The bytes read.
 * @returns The same bytes when they hash to the pin, else an {@link XsdSourceMismatch}.
 */
export const verifySource = Effect.fn("vocab.verifySource")(function* verifySource(
  path: SourcePath,
  bytes: Uint8Array,
): Effect.fn.Return<Uint8Array, XsdSourceMismatch, Digest.Digest> {
  const digest = yield* Digest.Digest;
  const actual = yield* digest.digestHex(Digest.sha256, bytes);
  const { sha256, url } = sources[path];

  if (actual !== sha256) {
    return yield* new XsdSourceMismatch({ actual, expected: sha256, path, url });
  }

  return bytes;
});

/**
 * Read a pinned XSD from the cache into its XML tree.
 *
 * The bytes are hashed before they are parsed, so a file that differs from its pin is never read
 * as a schema.
 *
 * @param path - The pinned file to read.
 * @returns The document's tree; an {@link XsdSourceMissing} when the file is absent, an
 *   {@link XsdSourceMismatch} when its bytes differ from the pin, or crust's refusal when it is not
 *   well-formed XML.
 */
export const readSource = Effect.fn("vocab.readSource")(function* readSource(
  path: SourcePath,
): Effect.fn.Return<
  XmlDocument,
  | XsdSourceMissing
  | XsdSourceMismatch
  | ReaderRefusal
  | WellFormednessError
  | PlatformError.PlatformError
  | Config.ConfigError,
  FileSystem.FileSystem | Digest.Digest
> {
  const fs = yield* FileSystem.FileSystem;
  const directory = yield* xsdDirectory;
  const bytes = yield* fs.readFile(`${directory}/${path}`).pipe(
    Effect.catchIf(
      (error) => error.reason._tag === "NotFound",
      () =>
        Effect.fail(
          new XsdSourceMissing({ directory, missing: [{ path, url: sources[path].url }] }),
        ),
    ),
  );

  return yield* readXml(yield* verifySource(path, bytes));
});
