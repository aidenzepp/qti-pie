import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Exit, FileSystem, Option } from "effect";
import { externalRows } from "#pantry/import/external.ts";
import { recordFile } from "#pantry/import/record.ts";
import { Rows } from "#pantry/import/tree.ts";
import { renderTree } from "#pantry/export/render.ts";
import { NodeXmlLang } from "#pantry/schema/attributes.ts";
import { Document } from "#pantry/schema/document.ts";
import { CsmSet } from "#pantry/schema/csm.ts";
import {
  ExternalLom,
  Lom,
  QtiMetadata,
  QtiMetadataInExternalLom,
} from "#pantry/schema/metadata.ts";
import { Node, TreeMisc } from "#pantry/schema/node.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { readXml } from "@qti-pie/crust/read.ts";

/**
 * The one row of a list that must hold exactly one.
 */
const only = <T>(list: readonly T[]): T => {
  assert.strictEqual(list.length, 1);

  return Option.getOrThrow(Option.fromNullishOr(list[0]));
};

const packageId = "55555555-5555-4555-8555-555555555555";

/**
 * The text of a file of the materialized fixture `name`.
 */
const textOf = (name: Parameters<typeof materialize>[0], file: string) =>
  Effect.gen(function* readText() {
    const fs = yield* FileSystem.FileSystem;
    const directory = yield* materialize(name);
    const bytes = yield* fs.readFile(path.join(directory, file));

    return new TextDecoder().decode(bytes);
  });

/**
 * The external rows of `meta/choice.xml` of `extmeta`.
 */
const extmetaRows = Effect.gen(function* extmetaRecord() {
  const text = yield* textOf("extmeta", "meta/choice.xml");
  const doc = yield* readXml(new TextEncoder().encode(text));

  return {
    text,
    ...(yield* externalRows(
      doc,
      {
        package: packageId,
        path: "meta/choice.xml",
        resource: "choice-meta",
        resourceType: "resourcemetadata/xml",
        version: "3.0.0",
      },
      Rows.empty(),
    )),
  };
});

layer(NodeServices.layer, { excludeTestServices: true })("import/external.ts", (suite) => {
  suite.effect("extmeta yields the record's document, owner and nested records", () =>
    Effect.gen(function* extmeta() {
      const { rows } = yield* extmetaRows;
      const document = only(Rows.of(rows, Document));
      const lom = only(Rows.of(rows, Lom));
      const external = only(Rows.of(rows, ExternalLom));
      const root = only(Rows.of(rows, Node).filter((node) => node.id === external.lom));

      assert.strictEqual(document.root, "externalLom");
      assert.strictEqual(document.resourceType, "resourcemetadata/xml");
      assert.strictEqual(document.resource, "choice-meta");
      assert.strictEqual(lom.owner, "external");
      assert.strictEqual(lom.id, external.lom);
      assert.strictEqual(external.document, document.id);
      assert.strictEqual(external.resource, "choice-meta");
      assert.strictEqual(root.kind, "lom:lom");

      const metadata = only(Rows.of(rows, QtiMetadata));
      const nested = only(Rows.of(rows, QtiMetadataInExternalLom));
      assert.strictEqual(metadata.host, "externalLom");
      assert.strictEqual(metadata.id, nested.id);
      assert.strictEqual(nested.lom, external.lom);

      const set = only(Rows.of(rows, CsmSet));
      const host = only(Rows.of(rows, Node).filter((node) => node.id === set.host));
      assert.strictEqual(host.kind, "lom:lom");
    }),
  );

  suite.effect("a lom:string keeps its xml:lang as a NodeXmlLang row and renders it back", () =>
    Effect.gen(function* langRecord() {
      const text =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<lom xmlns="http://ltsc.ieee.org/xsd/LOM"><classification><taxonPath><source>' +
        '<string xml:lang="en">jacs</string></source></taxonPath></classification></lom>';
      const doc = yield* readXml(new TextEncoder().encode(text));
      const { rows } = yield* externalRows(
        doc,
        {
          package: packageId,
          path: "meta/choice.xml",
          resource: "choice-meta",
          resourceType: "resourcemetadata/xml",
          version: "3.0.0",
        },
        Rows.empty(),
      );
      const document = only(Rows.of(rows, Document));
      const string = only(Rows.of(rows, Node).filter((node) => node.kind === "lom:string"));
      const lang = only(Rows.of(rows, NodeXmlLang));

      assert.strictEqual(lang.value, "en");
      assert.strictEqual(lang.attribute, "xml:lang");
      assert.strictEqual(lang.kind, "lom:string");
      assert.strictEqual(lang.rootKind, "externalLom");
      assert.strictEqual(lang.tree, document.id);
      assert.strictEqual(lang.node, string.id);
      assert.strictEqual(
        new TextDecoder().decode(canonicalize(renderTree(rows, document.id))),
        new TextDecoder().decode(canonicalize(doc)),
      );
    }),
  );

  suite.effect("a comment in the record's prolog is kept as a TreeMisc row", () =>
    Effect.gen(function* extmetaProlog() {
      const text = yield* textOf("extmeta", "meta/choice.xml");
      const declaration = text.indexOf("?>") + 2;
      const commented = `${text.slice(0, declaration)}<!-- external record -->${text.slice(declaration)}`;
      const doc = yield* readXml(new TextEncoder().encode(commented));
      const { rows } = yield* externalRows(
        doc,
        {
          package: packageId,
          path: "meta/choice.xml",
          resource: "choice-meta",
          resourceType: "resourcemetadata/xml",
          version: "3.0.0",
        },
        Rows.empty(),
      );
      const misc = only(Rows.of(rows, TreeMisc));

      assert.strictEqual(misc.kind, "comment");
      assert.strictEqual(misc.text, " external record ");
    }),
  );

  suite.effect("recordFile names the href, else the one file, else refuses", () =>
    Effect.gen(function* record() {
      const manifest = yield* textOf("extmeta-hrefless", "imsmanifest.xml");
      assert.isTrue(manifest.includes('<file href="meta/choice2.xml"/>'));

      assert.strictEqual(
        yield* recordFile({ files: ["a.xml", "b.xml"], href: Option.some("meta/choice.xml") }),
        "meta/choice.xml",
      );
      assert.strictEqual(
        yield* recordFile({ files: ["meta/choice.xml"], href: Option.none() }),
        "meta/choice.xml",
      );

      const refused = yield* Effect.exit(
        recordFile({ files: ["meta/choice.xml", "meta/choice2.xml"], href: Option.none() }),
      );
      assert.isTrue(Exit.isFailure(refused));
      assert.deepStrictEqual(
        Exit.isFailure(refused)
          ? Exit.findErrorOption(refused).pipe(Option.map((e) => e.rule))
          : Option.none(),
        Option.some("record-unnamed"),
      );
    }),
  );

  suite.effect("recordFile refuses a hrefless resource with no file", () =>
    Effect.gen(function* none() {
      const refused = yield* Effect.exit(recordFile({ files: [], href: Option.none() }));

      assert.isTrue(Exit.isFailure(refused));
    }),
  );
});
