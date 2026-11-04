import { Console, Effect, JsonSchema, Schema } from "effect";
import { Argument, Command } from "effect/cli";
import { ExportData } from "#pantry/cli/export.ts";
import { ImportData } from "#pantry/cli/import.ts";
import { ErrorObject, successEnvelope } from "#pantry/cli/output.ts";
import { RoundtripData } from "#pantry/cli/roundtrip.ts";

/**
 * The envelope each name stands for: a command's success envelope with its full data union, and
 * the error object a failure prints. `qti schema` lists exactly these names.
 */
const envelopes = {
  error: ErrorObject,
  export: successEnvelope("export", ExportData),
  import: successEnvelope("import", ImportData),
  roundtrip: successEnvelope("roundtrip", RoundtripData),
} as const;

/**
 * The names `qti schema` accepts, in the order the help lists them.
 */
const names = [
  "import",
  "export",
  "roundtrip",
  "error",
] as const satisfies readonly (keyof typeof envelopes)[];

/**
 * The JSON Schema 2020-12 document of one envelope.
 *
 * `Schema.toJsonSchemaDocument` returns the schema and its definitions without a `$schema`, so the
 * document is assembled here: `$schema`, the schema's own keys, and the definitions under `$defs`,
 * where the schema's references point.
 *
 * @param name - The envelope's name.
 * @returns The document, as plain JSON values.
 */
const documentOf = (name: (typeof names)[number]) => {
  const { definitions, schema } = Schema.toJsonSchemaDocument(envelopes[name]);

  return {
    $schema: JsonSchema.META_SCHEMA_URI_DRAFT_2020_12,
    ...schema,
    $defs: definitions,
  };
};

/**
 * Print the JSON Schema of an envelope: `import`, `export`, `roundtrip` or `error`, or with no name
 * one document keyed by all of them.
 *
 * It reads no configuration and no database, and prints JSON whatever `--output` says.
 */
export const schemaCommand = Command.make(
  "schema",
  { name: Argument.Literals("name", names).pipe(Argument.optional) },
  Effect.fn("cli.schema")(function* schemaHandler({ name }) {
    const document =
      name._tag === "Some"
        ? documentOf(name.value)
        : Object.fromEntries(names.map((each) => [each, documentOf(each)]));

    yield* Console.log(JSON.stringify(document));
  }),
).pipe(
  Command.withDescription(
    "Print the JSON Schema (draft 2020-12) of what a command prints with --output json, or of the error object",
  ),
  Command.withExamples([
    { command: "qti schema import", description: "Print the schema of import's output" },
    { command: "qti schema", description: "Print every schema in one document, keyed by name" },
  ]),
);
