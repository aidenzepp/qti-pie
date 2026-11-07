/**
 * What a command prints when it succeeds: the output mode the person chose, the envelope that
 * carries a command's data in `json` and `jsonl`, and the one emitter every command calls.
 */
import { Config, Console, Effect, Option, Schema } from "effect";
import { CliError, Flag, GlobalFlag } from "effect/cli";
import { RefusedLaw, WitnessKind } from "#pantry/package/refusal-origin.ts";

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
 * The `--output` setting. It is absent unless the line or `QTI_OUTPUT` gives it, so
 * {@link outputMode} can tell a mode that was asked for from the default.
 */
export const outputSetting = GlobalFlag.Setting("output")({
  flag: Flag.Literals("output", outputModes).pipe(
    Flag.withFallbackConfig(Config.schema(Schema.Literals(outputModes), "QTI_OUTPUT")),
    Flag.optional,
    Flag.withDescription(
      "How a command prints its result: text, json (one envelope) or jsonl (one line per entry, then the envelope) [env: QTI_OUTPUT] [default: text]",
    ),
  ),
});

/**
 * The `--json` setting, shorthand for `--output json`.
 */
export const jsonSetting = GlobalFlag.Setting("json")({
  flag: Flag.Boolean("json").pipe(
    Flag.withFallbackConfig(Config.Boolean("QTI_JSON")),
    Flag.withDefault(false),
    Flag.withDescription("Shorthand for --output json [env: QTI_JSON] [default: false]"),
  ),
});

/**
 * The `--jsonl` setting, shorthand for `--output jsonl`.
 */
export const jsonlSetting = GlobalFlag.Setting("jsonl")({
  flag: Flag.Boolean("jsonl").pipe(
    Flag.withFallbackConfig(Config.Boolean("QTI_JSONL")),
    Flag.withDefault(false),
    Flag.withDescription("Shorthand for --output jsonl [env: QTI_JSONL] [default: false]"),
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
    return "text";
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
const pickMode = (named: readonly OutputMode[]): OutputMode | undefined =>
  named.find((mode) => mode !== "text") ?? named[0];

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
 * @returns The mode, or `undefined` when the arguments name none.
 */
export const modeOfArguments = (args: readonly string[]): OutputMode | undefined => {
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
  const json = yield* Config.Boolean("QTI_JSON").pipe(Config.withDefault(false));
  const jsonl = yield* Config.Boolean("QTI_JSONL").pipe(Config.withDefault(false));

  return Option.fromNullishOr(
    pickMode([
      ...Option.toArray(output),
      ...(json ? (["json"] as const) : []),
      ...(jsonl ? (["jsonl"] as const) : []),
    ]),
  );
}).pipe(Effect.orElseSucceed(() => Option.none<OutputMode>()));

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
 * witness) and `row` (a row the host located) name one in the message, and `unreported` names
 * none, for a constraint PostgreSQL reports by its name alone.
 */
export const ErrorWitness = WitnessKind;

/**
 * What a failure prints under `json` and `jsonl`: one line on standard error, in the shape of the
 * success envelope's `schema_version`, `command` and `ok`, with `error` true and the failure's
 * kind, message, next step and exit code.
 *
 * - `rule` is present only when an import was refused, and `laws`, `sources` and `witness` only when
 *   the database refused it: the laws its refusal names, where each is stated, and whether the
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
  rule: Schema.optionalKey(Schema.String),
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
 * `value` is unknown to the type checker because the envelope's schema is built from a schema
 * parameter; encoding still checks it against that schema, and a mismatch is a defect in qti.
 */
const printLine = (
  schema: Schema.Constraint & { readonly EncodingServices: never },
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- The envelope's schema is built from a schema parameter, so its type is not nameable here; `encodeUnknownEffect` is the check that parses `value`.
  value: unknown,
) =>
  Schema.encodeUnknownEffect(Schema.fromJsonString(schema))(value).pipe(
    Effect.orDie,
    Effect.flatMap((line) => Console.log(line)),
  );

/**
 * What a command prints when it succeeds.
 *
 * `stream` is for a command whose data holds a list: in `jsonl` each of its `lines` is printed
 * first, then the envelope with `summary` as its data in place of the whole.
 */
export interface Emission<
  Data extends Schema.Constraint & { readonly EncodingServices: never },
  Line extends Schema.Constraint & { readonly EncodingServices: never },
  Summary extends Schema.Constraint & { readonly EncodingServices: never },
> {
  /**
   * The command's name.
   */
  readonly command: string;
  /**
   * What the command returns, for `json` and for `jsonl` without a `stream`.
   */
  readonly data: Data["Type"];
  /**
   * The schema of `data`.
   */
  readonly dataSchema: Data;
  /**
   * False only when the command succeeded in running but its result is a failure to match, as a
   * round trip whose report holds a differing entry.
   */
  readonly ok: boolean;
  /**
   * The lines `jsonl` prints before its summary, and the summary.
   */
  readonly stream?: {
    readonly lines: readonly Line["Type"][];
    readonly lineSchema: Line;
    readonly summary: Summary["Type"];
    readonly summarySchema: Summary;
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
export const emitSuccess = Effect.fn("cli.emitSuccess")(function* emitSuccess<
  Data extends Schema.Constraint & { readonly EncodingServices: never },
  Line extends Schema.Constraint & { readonly EncodingServices: never },
  Summary extends Schema.Constraint & { readonly EncodingServices: never },
>(mode: OutputMode, emission: Emission<Data, Line, Summary>) {
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
