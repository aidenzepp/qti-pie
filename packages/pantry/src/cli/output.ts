/**
 * What a command prints when it succeeds: the output mode the person chose, the envelope that
 * carries a command's data in `json` and `jsonl`, and the one emitter every command calls.
 */
import { Array as Arr, Config, Console, Effect, Option, Schema } from "effect";
import { CliError, Flag, GlobalFlag } from "effect/cli";
import { RefusedKind, RefusedLaw, WitnessKind } from "#pantry/package/refusal-origin.ts";

/**
 * The modes `--output` names, in the order the help lists them.
 */
export const outputModes = ["text", "json", "jsonl"] as const;

/**
 * How a command prints its result: `text` for a person, `json` for one envelope on one line,
 * `jsonl` for a stream of lines that ends with the envelope.
 */
export type OutputMode = (typeof outputModes)[number];

/**
 * The mode a run prints in when neither the line nor `QTI_OUTPUT`, `QTI_JSON` or `QTI_JSONL`
 * names one, as the help of `--output` says.
 */
export const defaultOutputMode: OutputMode = "text";

/**
 * What `--json` and `--jsonl`, and `QTI_JSON` and `QTI_JSONL`, are when nothing sets them: off, as
 * their help says.
 */
const shorthandDefault = false;

/**
 * The `--output` setting. It is absent unless the line or `QTI_OUTPUT` gives it, so
 * {@link outputMode} can tell a mode that was asked for from the default.
 */
export const outputSetting = GlobalFlag.Setting("output")({
  flag: Flag.Literals("output", outputModes).pipe(
    Flag.withFallbackConfig(Config.schema(Schema.Literals(outputModes), "QTI_OUTPUT")),
    Flag.optional,
    Flag.withDescription(
      `How a command prints its result: text, json (one envelope) or jsonl (one line per entry, then the envelope) [env: QTI_OUTPUT] [default: ${defaultOutputMode}]`,
    ),
  ),
});

/**
 * The `--json` setting, shorthand for `--output json`.
 */
export const jsonSetting = GlobalFlag.Setting("json")({
  flag: Flag.Boolean("json").pipe(
    Flag.withFallbackConfig(Config.Boolean("QTI_JSON")),
    Flag.withDefault(shorthandDefault),
    Flag.withDescription(
      `Shorthand for --output json [env: QTI_JSON] [default: ${String(shorthandDefault)}]`,
    ),
  ),
});

/**
 * The `--jsonl` setting, shorthand for `--output jsonl`.
 */
export const jsonlSetting = GlobalFlag.Setting("jsonl")({
  flag: Flag.Boolean("jsonl").pipe(
    Flag.withFallbackConfig(Config.Boolean("QTI_JSONL")),
    Flag.withDefault(shorthandDefault),
    Flag.withDescription(
      `Shorthand for --output jsonl [env: QTI_JSONL] [default: ${String(shorthandDefault)}]`,
    ),
  ),
});

/**
 * The three output settings, for the root command's `Command.withGlobalFlags`.
 */
export const outputGlobalFlags = [outputSetting, jsonSetting, jsonlSetting] as const;

/**
 * The output mode this run resolved from `--output`, `--json`, `--jsonl` and their `QTI_*`
 * variables, `text` when none is given.
 *
 * Two flags that name different modes fail with a usage error, so a handler that reads the mode
 * first fails before it does any work.
 */
export const outputMode = Effect.gen(function* resolveOutputMode() {
  const named: readonly OutputMode[] = [
    ...Option.toArray(yield* outputSetting),
    ...((yield* jsonSetting) ? (["json"] as const) : []),
    ...((yield* jsonlSetting) ? (["jsonl"] as const) : []),
  ];
  const [first, ...rest] = named;

  if (first === undefined) {
    return defaultOutputMode;
  }

  if (rest.some((mode) => mode !== first)) {
    return yield* new CliError.UserError({
      cause: "conflicting output modes",
      userMessage: `--output, --json and --jsonl name different modes (${[...new Set(named)].join(", ")}). Give one of them.`,
    });
  }

  return first;
}).pipe(Effect.withSpan("cli.outputMode"));

/**
 * The mode of several that were named: the first that is not `text`, else `text`, else none.
 */
const pickMode = (named: readonly OutputMode[]): Option.Option<OutputMode> =>
  Arr.findFirst(named, (mode) => mode !== "text").pipe(Option.orElse(() => Arr.head(named)));

/**
 * The value `--output` gives in `arg`: the next word for `--output`, the rest for `--output=…`.
 */
const outputValue = (arg: string, next: string | undefined): string | undefined => {
  const prefix = "--output=";

  if (arg === "--output") {
    return next;
  }

  return arg.startsWith(prefix) ? arg.slice(prefix.length) : undefined;
};

/**
 * The mode the arguments before the first `--` name, read as a person typed them and before
 * anything parses them: `--output <mode>`, `--output=<mode>`, `--json` and `--jsonl`. When they
 * name more than one mode, the first machine-readable one wins, so a program that asked for JSON
 * still gets JSON for the error that says its flags disagree.
 *
 * @param args - The command line after the program name.
 * @returns The mode, or none when the arguments name none.
 */
export const modeOfArguments = (args: readonly string[]): Option.Option<OutputMode> => {
  const end = args.indexOf("--");
  const before = end === -1 ? args : args.slice(0, end);
  const named = before.flatMap((arg, index): readonly OutputMode[] => {
    if (arg === "--json" || arg === "--jsonl") {
      return [arg === "--json" ? "json" : "jsonl"];
    }

    const value = outputValue(arg, before[index + 1]);

    return outputModes.filter((mode) => mode === value);
  });

  return pickMode(named);
};

/**
 * The mode `QTI_OUTPUT`, `QTI_JSON` and `QTI_JSONL` name, none when none is set. A value
 * that is malformed names no mode here; the settings report it when a handler reads them.
 */
export const modeOfEnvironment = Effect.gen(function* resolveEnvironmentMode() {
  const output = yield* Config.schema(Schema.Literals(outputModes), "QTI_OUTPUT").pipe(
    Config.option,
  );
  const json = yield* Config.Boolean("QTI_JSON").pipe(Config.withDefault(shorthandDefault));
  const jsonl = yield* Config.Boolean("QTI_JSONL").pipe(Config.withDefault(shorthandDefault));

  return pickMode([
    ...Option.toArray(output),
    ...(json ? (["json"] as const) : []),
    ...(jsonl ? (["jsonl"] as const) : []),
  ]);
}).pipe(Effect.catchTag("ConfigError", () => Effect.succeedNone));

/**
 * One law the database refused an import under, as the error object names it: the refusal's own
 * `RefusedLaw` (`#pantry/package/refusal-origin.ts`).
 */
export const ErrorLaw = RefusedLaw;

/**
 * One law of a refusal, as {@link ErrorLaw} reads it.
 */
export type LawFact = typeof ErrorLaw.Type;

/**
 * How a refusal the database gave names the row that broke its laws, as the error object prints
 * it: the refusal's own `WitnessKind` (`#pantry/package/refusal-origin.ts`). `key` (grizzle's key
 * witness) and `row` (a row the caller holds) name one in the message, and `unreported` names
 * none, for a foreign key or a law no row the ChangeSet states breaks as grizzle judges it.
 */
export const ErrorWitness = WitnessKind;

/**
 * How grizzle decided the laws a refusal the database gave names, as the error object prints it:
 * the refusal's own `RefusedKind` (`#pantry/package/refusal-origin.ts`). `every`: each law is
 * broken; `first`: the laws of the CHECK PostgreSQL tried first, and the row may break others too;
 * `some`: at least one law is broken, and nothing says which.
 */
export const ErrorRefusedKind = RefusedKind;

/**
 * What a failure prints under `json` and `jsonl`: one line on standard error, in the shape of the
 * success envelope's `schema_version`, `command` and `ok`, with `error` true and the failure's
 * kind, message, next step and exit code.
 *
 * - `rules` is present only when an import was refused: the rules it was refused under, each once,
 *   most specific first, none where the database named only laws the law table does not hold.
 *   `refused_kind`, `laws`, `sources` and `witness` are present only when the database refused it:
 *   how grizzle decided the laws its refusal names, the laws, where each is stated, and whether the
 *   message names the row that broke them (`key` or `row`) or the database named none
 *   (`unreported`).
 * - `failure` is present only for an `internal` failure qti can name, such as an export that cannot
 *   rebuild a stored package: the failure's tag.
 */
export const ErrorObject = Schema.Struct({
  command: Schema.String,
  error: Schema.Literal(true),
  exit_code: Schema.Int,
  failure: Schema.optionalKey(Schema.String),
  help: Schema.String,
  kind: Schema.String,
  laws: Schema.optionalKey(Schema.Array(ErrorLaw)),
  message: Schema.String,
  ok: Schema.Literal(false),
  refused_kind: Schema.optionalKey(ErrorRefusedKind),
  rules: Schema.optionalKey(Schema.Array(Schema.String)),
  schema_version: Schema.Literal(1),
  sources: Schema.optionalKey(Schema.Array(Schema.String)),
  witness: Schema.optionalKey(ErrorWitness),
});

/**
 * The envelope every command wraps its data in when it prints `json` or `jsonl`.
 *
 * @param command - The command's name, which the envelope's `command` field must equal.
 * @param data - The schema of the data the command returns.
 * @returns The schema of `{ schema_version: 1, command, ok, data }`.
 */
export const successEnvelope = <const Name extends string, Data extends Schema.Constraint>(
  command: Name,
  data: Data,
) =>
  Schema.Struct({
    command: Schema.Literal(command),
    data,
    ok: Schema.Boolean,
    schema_version: Schema.Literal(1),
  });

/**
 * Print `value`, encoded through `schema`, as one line of JSON.
 *
 * The type checker holds `value` to the schema's type; a value the schema's checks still refuse,
 * such as a fractional `exit_code`, is a defect in qti and dies.
 *
 * @param schema - The line's schema.
 * @param value - The line, of the schema's type.
 * @returns Prints the line.
 */
const printLine = <S extends Schema.Constraint & { readonly EncodingServices: never }>(
  schema: S,
  value: S["Type"],
) =>
  Schema.encodeEffect(Schema.fromJsonString(schema))(value).pipe(
    Effect.orDie,
    Effect.flatMap((line) => Console.log(line)),
  );

/**
 * What a command prints when it succeeds.
 *
 * `stream` is for a command whose data holds a list: in `jsonl` each of its `lines` is printed
 * first, then the envelope with `summary` as its data in place of the whole.
 *
 * Its type parameters are the values' types, each schema a `Schema.Codec` of one, never the
 * schemas' own types. `Schema.Struct` reads a field's optionality off its schema's type by a
 * conditional type, which over a type parameter stays unresolved, so an envelope built around a
 * schema parameter has no type to check its value against. A `Schema.Codec`'s optionality does not
 * depend on its type parameter, so {@link successEnvelope} of one resolves to the type `printLine`
 * checks the envelope by. `data`, `lines` and `summary` are `NoInfer`, so each value's type is read
 * from its schema alone.
 */
export interface Emission<Data, Line, Summary> {
  /**
   * The command's name.
   */
  readonly command: string;
  /**
   * What the command returns, for `json` and for `jsonl` without a `stream`.
   */
  readonly data: NoInfer<Data>;
  /**
   * The schema of `data`.
   */
  readonly dataSchema: Schema.Codec<Data, unknown, unknown>;
  /**
   * False only when the command succeeded in running but its result is a failure to match, as a
   * round trip whose report holds a differing entry.
   */
  readonly ok: boolean;
  /**
   * The lines `jsonl` prints before its summary, and the summary.
   */
  readonly stream?: {
    readonly lines: readonly NoInfer<Line>[];
    readonly lineSchema: Schema.Codec<Line, unknown, unknown>;
    readonly summary: NoInfer<Summary>;
    readonly summarySchema: Schema.Codec<Summary, unknown, unknown>;
  };
  /**
   * What `text` mode prints, exactly as the command printed it before `--output` existed, or
   * nothing when it prints nothing.
   */
  readonly text?: string;
}

/**
 * Print a command's result in `mode`: the text as the command always printed it, one envelope line
 * under `json`, or under `jsonl` the stream's lines and then the envelope.
 *
 * @param mode - The output mode the run resolved.
 * @param emission - The command's name, its data and the text it prints.
 */
export const emitSuccess = Effect.fn("cli.emitSuccess")(function* emitSuccess<Data, Line, Summary>(
  mode: OutputMode,
  emission: Emission<Data, Line, Summary>,
) {
  const { command, data, dataSchema, ok, stream, text } = emission;

  if (mode === "text") {
    if (text !== undefined) {
      yield* Console.log(text);
    }

    return;
  }

  if (mode === "jsonl" && stream !== undefined) {
    for (const line of stream.lines) {
      yield* printLine(stream.lineSchema, line);
    }

    yield* printLine(successEnvelope(command, stream.summarySchema), {
      command,
      data: stream.summary,
      ok,
      schema_version: 1,
    });

    return;
  }

  yield* printLine(successEnvelope(command, dataSchema), {
    command,
    data,
    ok,
    schema_version: 1,
  });
});
