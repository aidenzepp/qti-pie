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
import { SaxesParser } from "saxes";
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
 * The pinned XSDs, keyed by their path under {@link xsdDirectory}.
 *
 * The QTI 3.0 and 3.0.1 ASI and content-packaging XSDs and the QTI metadata XSD, with the MathML 3,
 * SSML 1.1, `xml.xsd` and XInclude schemas the ASI XSDs import, at the locations the ASI XSDs'
 * `xs:import` elements name. MathML's and SSML's entry files include their siblings by relative
 * path, so the siblings are pinned at the same folder.
 *
 * The content-packaging XSDs import four more vocabularies, each pinned in a folder of its own: the
 * loose LOM binding (`lom/`), the curriculum standards metadata (`csm/`) and the
 * content-packaging extension (`cpext/`), whose 3.0 and 3.0.1 files each import their version's
 * AfA DRD (`drd/`) and the XLink attributes (`xlink/`). The usage data XSD (`usagedata/`) is the
 * schema of a usage data document; 1EdTech publishes it for QTI 3.0 only, and 3.0.1 reads the same
 * file. These nine were taken on 2026-11-05, the operator's ruling, by the same rule.
 */
export const sources = {
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
  "usagedata/imsqti_usagedatav3p0_v1p0.xsd": {
    sha256: "7d32e1aca4dc8cc681b87c97588a3bd6321e0a841504870b060b0da89c468d32",
    url: "https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_usagedatav3p0_v1p0.xsd",
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
 * The paths of the pinned XSDs, in the order {@link sources} lists them.
 */
export const sourcePaths: readonly SourcePath[] = Object.keys(sources).filter(isSourcePath);

/**
 * The cache directory the pinned XSDs are read from: `.cache/gr8des/qti3/xsd` under `HOME`.
 */
export const xsdDirectory = Config.NonEmptyString("HOME").pipe(
  Config.map((home) => `${home}/.cache/gr8des/qti3/xsd`),
);

/**
 * The command that downloads every pinned XSD into {@link xsdDirectory} and checks each against its
 * pin: `src/vocab/derive/fetch-xsds.ts`, run from anywhere in the workspace. The errors that a
 * missing or changed cached file raises name it as their repair.
 */
export const fetchCommand = "pnpm --filter @qti-pie/pantry run fetch-xsds";

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

    return `${this.missing.length} of the ${sourcePaths.length} pinned XSDs are not in ${this.directory}: ${files}. Run \`${fetchCommand}\` to download them into that directory, each checked against its pin.`;
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
    return `The cached ${this.path} has SHA-256 ${this.actual}, not the pinned ${this.expected}. Run \`${fetchCommand}\` to download it again from ${this.url}; if the published file itself changed, re-pin it in src/vocab/derive/sources.ts and re-run the deriver's tests.`;
  }
}

/**
 * Fail unless every pinned XSD is in the cache directory.
 *
 * Only presence is checked, so the cost is one `stat` per file; a present file's content is checked
 * when it is read.
 *
 * @returns Nothing when every pinned file is present, else an {@link XsdSourceMissing} naming each
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
 * A pinned XSD's start tags could not be counted, though crust read the same bytes as well-formed
 * XML: the line reader and crust's reader disagree on the file.
 *
 * `path` is the pinned file and `reason` the line reader's message.
 */
export class XsdLinesUnread extends Schema.TaggedError<XsdLinesUnread>()("XsdLinesUnread", {
  path: Schema.String,
  reason: Schema.String,
}) {
  /**
   * Which file's lines are unread, and why.
   */
  override get message(): string {
    return `The start tags of ${this.path} could not be counted, though the file is well-formed XML: ${this.reason}. Report it with the file; no derivation can cite its lines until then.`;
  }
}

/**
 * A pinned XSD read: its tree, the file it was read from, and the line each element's start tag
 * begins on, in the order the elements' start tags stand in the file, which is the tree's
 * document order.
 *
 * Crust's tree keeps no positions, so the lines are counted in a second pass over the same bytes,
 * and an element's line is the one at its index in document order.
 */
export interface Placed {
  readonly document: XmlDocument;
  readonly file: SourcePath;
  readonly lines: readonly number[];
}

/**
 * Count the line each start tag of a document begins on, in document order: saxes' line at the
 * start of each tag, before its attributes, which may run over further lines. The text is decoded
 * as crust decoded it, by the charset it records, so a file in UTF-16 is read as one.
 *
 * @param text - The document's text.
 * @returns The lines, one per element.
 */
const startLinesOf = (text: string): readonly number[] => {
  const parser = new SaxesParser();
  const lines: number[] = [];

  parser.on("opentagstart", () => {
    lines.push(parser.line);
  });
  parser.write(text).close();

  return lines;
};

/**
 * Read a pinned XSD from the cache into its XML tree and the lines of its start tags.
 *
 * The bytes are hashed before they are parsed, so a file that differs from its pin is never read
 * as a schema.
 *
 * @param path - The pinned file to read.
 * @returns The document's tree and lines; an {@link XsdSourceMissing} when the file is absent, an
 *   {@link XsdSourceMismatch} when its bytes differ from the pin, crust's refusal when it is not
 *   well-formed XML, or an {@link XsdLinesUnread} when its start tags cannot be counted.
 */
export const readPlaced = Effect.fn("vocab.readPlaced")(function* readPlaced(
  path: SourcePath,
): Effect.fn.Return<
  Placed,
  | XsdSourceMissing
  | XsdSourceMismatch
  | XsdLinesUnread
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

  const verified = yield* verifySource(path, bytes);
  const document = yield* readXml(verified);
  const lines = yield* Effect.try({
    catch: (cause) => new XsdLinesUnread({ path, reason: String(cause) }),
    try: () => startLinesOf(new TextDecoder(document.charset).decode(verified)),
  });

  return { document, file: path, lines } satisfies Placed;
});

/**
 * Read a pinned XSD from the cache into its XML tree.
 *
 * @param path - The pinned file to read.
 * @returns The document's tree, or {@link readPlaced}'s refusal.
 */
export const readSource = Effect.fn("vocab.readSource")(function* readSource(path: SourcePath) {
  return (yield* readPlaced(path)).document;
});
