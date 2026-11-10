import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import * as pantry from "@qti-pie/pantry";
import { Effect, FileSystem, Schema } from "effect";
import { qti } from "#pantry/qti/schema.ts";

/**
 * The part of pantry's manifest the entry rule reads: its `exports` map.
 */
const PackageJson = Schema.fromJsonString(
  Schema.Struct({ exports: Schema.Record(Schema.String, Schema.String) }),
);

/**
 * The entry's runtime exports, spec section 2.1's values and the served author login's service
 * (`ServedAuthorLogin`, decision 496's M2), sorted: a name added to the entry or
 * dropped from it fails the surface test, so each change to the surface is made on purpose.
 */
const runtimeNames: readonly string[] = [
  "BaseType",
  "CdnOptions",
  "CommitUnresolved",
  "DeclarationIdentifier",
  "Document",
  "DocumentNotFound",
  "ItemRefDocument",
  "Named",
  "Package",
  "PackageNotFound",
  "Section",
  "SectionMember",
  "SectionSelection",
  "ServedAuthorLogin",
  "TestDocument",
  "TestFlag",
  "authorLogin",
  "authorRole",
  "documentScanOf",
  "documentXml",
  "exportPackage",
  "importPackage",
  "listDocuments",
  "listPackages",
  "previewPackage",
  "publishedRelations",
  "qti",
  "readDocument",
  "singleCdn",
];

/**
 * One published relation as the contract states it: a relation with its key and published fields,
 * or a roster, published with its handles and no fields.
 */
interface ContractEntry {
  readonly fields?: readonly string[];
  readonly key?: readonly string[];
  readonly kind: "relation" | "roster";
}

/**
 * The published relations' contract, spec section 2.2 on the schema #55 brought: each relation's
 * key and published fields, `Document`'s type field named `documentType` and `Section` without
 * `visible`, which is its `TestFlag` row named `visible` (decision 503), and `BaseType`, a roster
 * published with its handles and no fields.
 */
const publishedContract = {
  BaseType: { kind: "roster" },
  DeclarationIdentifier: {
    fields: ["node", "document", "identifier", "declarationKind"],
    key: ["node"],
    kind: "relation",
  },
  Document: {
    fields: ["node", "package", "path", "documentType", "rootKind"],
    key: ["node"],
    kind: "relation",
  },
  ItemRefDocument: {
    fields: ["node", "document", "package", "path"],
    key: ["node"],
    kind: "relation",
  },
  Named: {
    fields: ["node", "document", "identifier", "kind", "parent", "part"],
    key: ["node"],
    kind: "relation",
  },
  Package: { fields: ["id", "name"], key: ["id"], kind: "relation" },
  Section: {
    fields: [
      "node",
      "document",
      "parent",
      "keepTogether",
      "shuffle",
      "withReplacement",
      "members",
      "required",
    ],
    key: ["node"],
    kind: "relation",
  },
  SectionMember: {
    fields: ["node", "section", "document", "kind", "required", "start"],
    key: ["node"],
    kind: "relation",
  },
  SectionSelection: {
    fields: ["node", "document", "parent", "select", "withReplacement"],
    key: ["node"],
    kind: "relation",
  },
  TestDocument: {
    fields: ["node", "package", "path", "rootKind"],
    key: ["node"],
    kind: "relation",
  },
  TestFlag: { fields: ["node", "name", "value"], key: ["node", "name"], kind: "relation" },
} satisfies Readonly<Record<string, ContractEntry>>;

layer(NodeServices.layer, { excludeTestServices: true })("the package entry", (it) => {
  it.effect("is the one subpath the exports map lists", () =>
    Effect.gen(function* exportsMapIsTheEntry() {
      const fileSystem = yield* FileSystem.FileSystem;
      const text = yield* fileSystem.readFileString(`${import.meta.dirname}/../package.json`);
      const manifest = yield* Schema.decodeUnknownEffect(PackageJson)(text);

      assert.deepStrictEqual(manifest.exports, { ".": "./src/index.ts" });
    }),
  );

  it.effect("exports exactly the surface's runtime names", () =>
    Effect.sync(() => {
      assert.deepStrictEqual(Object.keys(pantry).toSorted(), runtimeNames);
    }),
  );

  it.effect("publishes each relation with its contract key and fields", () =>
    Effect.sync(() => {
      const published: Readonly<Record<string, ContractEntry>> = Object.fromEntries(
        Object.entries(pantry.publishedRelations).map(([name, entry]) => [
          name,
          entry.kind === "roster"
            ? { kind: entry.kind }
            : { fields: entry.fields, key: entry.key, kind: entry.kind },
        ]),
      );

      assert.deepStrictEqual(published, publishedContract);
    }),
  );

  it.effect(
    "publishes the relations the Qti schema holds, by name, as the entry exports them",
    () =>
      Effect.sync(() => {
        const relations = new Map<string, object>(Object.entries(qti().relations));
        const exported = new Map<string, object>(Object.entries(pantry));

        for (const [name, entry] of Object.entries(pantry.publishedRelations)) {
          assert.strictEqual(entry.relation, relations.get(name), name);
          assert.strictEqual(exported.get(name), entry.relation, name);
        }
      }),
  );
});
