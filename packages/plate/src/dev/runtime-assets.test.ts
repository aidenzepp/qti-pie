import { readFileSync, readdirSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit } from "effect";
import { defaultTreeAdapter, parse } from "parse5";
import type { DefaultTreeAdapterTypes } from "parse5";
import { pageHeaders } from "#plate/dev/frame.ts";
import { createHandler } from "#plate/dev/page.ts";
import {
  bootModule,
  readRuntimeModule,
  RuntimeModuleUnreadable,
  runtimeModules,
  runtimeUrl,
} from "#plate/dev/runtime-assets.ts";
import type { ReadModule } from "#plate/dev/runtime-assets.ts";
import { readImports } from "#plate/test/imports.ts";

/**
 * An element as parse5's document parser gives it.
 */
type Parsed = DefaultTreeAdapterTypes.Element;

/**
 * The origin every request is made against; the handler never opens it.
 */
const origin = "http://127.0.0.1:5190";

/**
 * The page every header and markup case reads: the 404 page, which the frame writes like every
 * other page and which needs no corpus.
 */
const missing = `${origin}/no-such-page`;

/**
 * The directory of the runtime kinds' controllers, relative to the package's `src/`.
 */
const interactionsDirectory = new URL("../interactions/", import.meta.url);

/**
 * The runtime kinds, written out: a Node test imports no `.dom.ts` module, so `runtimeKinds` of
 * `runtime/contract.dom.ts` cannot be read here.
 */
const kinds = [
  "associate",
  "drawing",
  "gap-match",
  "graphic-associate",
  "graphic-gap-match",
  "graphic-order",
  "hotspot",
  "hottext",
  "match",
  "media",
  "order",
  "portable-custom",
  "position-object",
  "select-point",
] as const;

/**
 * Today's page policy with `script-src 'self'` in place of `script-src 'none'`, written out in full
 * so the case does not derive its expectation from the code it checks.
 */
const policyWithRuntime =
  "default-src 'none'; style-src 'self'; img-src 'self' https: http:; media-src 'self' https: http:; object-src 'self'; frame-src 'self'; script-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";

/**
 * Collect the elements of a parse5 tree that have a tag, in document order.
 *
 * @param node The tree's root.
 * @param tag The tag.
 * @returns The elements.
 */
const elementsWith = (node: DefaultTreeAdapterTypes.ParentNode, tag: string): readonly Parsed[] =>
  node.childNodes.flatMap((child) =>
    defaultTreeAdapter.isElementNode(child)
      ? [...(child.tagName === tag ? [child] : []), ...elementsWith(child, tag)]
      : [],
  );

/**
 * Read one attribute of a parse5 element.
 *
 * @param element The element.
 * @param name The attribute's name.
 * @returns Its value, or `undefined` when the element has none.
 */
const attributeOf = (element: Parsed, name: string): string | undefined =>
  element.attrs.find((attribute) => attribute.name === name)?.value;

/**
 * Request a path of a handler.
 *
 * @param handle The playground's handler.
 * @param target The request's URL.
 * @param method The request's method.
 * @returns The response, its body read once as text.
 */
const fetched = (handle: ReturnType<typeof createHandler>, target: string, method = "GET") =>
  Effect.promise(async () => {
    const response = await handle(new Request(target, { method }));

    return { headers: response.headers, status: response.status, text: await response.text() };
  });

/**
 * Hold a test graph's modules in memory: a module outside the record fails to read.
 *
 * @param modules Each module's TypeScript, by its path under `src/`.
 * @param reads Where each read is recorded, by module, none by default.
 * @returns The reader.
 */
const memory =
  (modules: Readonly<Record<string, string>>, reads: string[] = []): ReadModule =>
  (id) => {
    const source = modules[id];

    reads.push(id);

    return source === undefined
      ? Effect.fail(new RuntimeModuleUnreadable({ detail: "not in the test graph", module: id }))
      : Effect.succeed(source);
  };

describe("dev/runtime-assets.ts: the runtime's module graph", () => {
  it.effect(
    "[m3d-13] the runtime graph from runtime.dom.ts lists every reached module once and only .dom.ts modules",
    () =>
      Effect.gen(function* graph() {
        const modules = yield* runtimeModules("runtime.dom.ts", readRuntimeModule);
        const ids = modules.map((module) => module.id);

        assert.strictEqual(new Set(ids).size, ids.length);
        assert.deepStrictEqual(
          ids.filter((id) => !id.endsWith(".dom.ts")),
          [],
        );
        assert.strictEqual(ids[0], "runtime.dom.ts");
        assert.includeMembers(ids, [
          "runtime.dom.ts",
          "runtime/contract.dom.ts",
          "runtime/announce.dom.ts",
          ...kinds.map((kind) => `interactions/${kind}.dom.ts`),
        ]);

        const onDisk = readdirSync(interactionsDirectory).filter((file) =>
          file.endsWith(".dom.ts"),
        );
        assert.includeMembers(
          onDisk.map((file) => `interactions/${file}`),
          ids.filter((id) => id.startsWith("interactions/")),
        );
        assert.deepStrictEqual(
          modules.map((module) => module.url),
          ids.map(runtimeUrl),
        );
      }),
  );

  it.effect(
    "[m3d-13] a served module is JavaScript with every #plate/ specifier rewritten to a /runtime/ URL",
    () =>
      Effect.gen(function* served() {
        const handle = createHandler({ runtime: true });
        const modules = yield* runtimeModules(bootModule, readRuntimeModule);

        assert.includeMembers(
          modules.map((module) => module.id),
          [bootModule, "runtime.dom.ts"],
        );

        for (const { id, url } of modules) {
          const response = yield* fetched(handle, `${origin}${url}`);
          const declared = readImports(response.text);

          assert.strictEqual(response.status, 200, url);
          assert.strictEqual(
            response.headers.get("content-type"),
            "text/javascript; charset=utf-8",
          );
          assert.notInclude(response.text, 'from "#plate/', id);
          assert.deepStrictEqual(declared.unreadable, [], id);
          assert.isTrue(
            declared.imports.every(
              ({ specifier }) => specifier.startsWith("/runtime/") && specifier.endsWith(".js"),
            ),
            id,
          );
          assert.strictEqual(stripTypeScriptTypes(response.text), response.text, id);
        }

        const entry = yield* fetched(handle, `${origin}/runtime/runtime.dom.js`);

        assert.include(entry.text, 'from "/runtime/runtime/contract.dom.js"');
        assert.include(entry.text, 'from "/runtime/interactions/hotspot.dom.js"');
        assert.notInclude(entry.text, "import type");
        assert.strictEqual(
          entry.text,
          stripTypeScriptTypes(
            readFileSync(new URL("../runtime.dom.ts", import.meta.url), "utf-8"),
          ).replaceAll(/from "#plate\/(?<path>[^"]+)\.ts"/gu, 'from "/runtime/$<path>.js"'),
        );
      }),
  );

  it.effect(
    "[m3d-13] a module that value-imports a package fails the walk with a typed error naming it",
    () =>
      Effect.gen(function* walk() {
        const direct = yield* Effect.flip(
          runtimeModules(
            "a.dom.ts",
            memory({
              "a.dom.ts": 'import { Option } from "effect";\nexport const a = Option.none();\n',
            }),
          ),
        );
        const reached = yield* Effect.flip(
          runtimeModules(
            "a.dom.ts",
            memory({
              "a.dom.ts": 'import { b } from "#plate/b.dom.ts";\nexport const a = b;\n',
              "b.dom.ts": 'import * as Effect from "effect";\nexport const b = Effect;\n',
            }),
          ),
        );
        const inline = yield* Effect.flip(
          runtimeModules(
            "a.dom.ts",
            memory({ "a.dom.ts": 'import { type Option } from "effect";\nexport const a = 1;\n' }),
          ),
        );
        const builtin = yield* Effect.flip(
          runtimeModules(
            "a.dom.ts",
            memory({ "a.dom.ts": 'export { readFile } from "node:fs/promises";\n' }),
          ),
        );

        assert.strictEqual(direct._tag, "RuntimeImportRefused");
        assert.deepStrictEqual(
          direct._tag === "RuntimeImportRefused" && [direct.module, direct.specifier],
          ["a.dom.ts", "effect"],
        );
        assert.include(direct.message, "a.dom.ts");
        assert.include(direct.message, '"effect"');
        assert.deepStrictEqual(
          reached._tag === "RuntimeImportRefused" && [reached.module, reached.specifier],
          ["b.dom.ts", "effect"],
        );
        assert.deepStrictEqual(
          inline._tag === "RuntimeImportRefused" && [inline.module, inline.specifier],
          ["a.dom.ts", "effect"],
        );
        assert.deepStrictEqual(
          builtin._tag === "RuntimeImportRefused" && [builtin.module, builtin.specifier],
          ["a.dom.ts", "node:fs/promises"],
        );
      }),
  );

  it.effect(
    "[m3d-13] the walk keeps what its control keeps: type-only imports vanish, a cycle and a shared module are read once, and a comment or string that looks like an import is not one",
    () =>
      Effect.gen(function* control() {
        const reads: string[] = [];
        const modules = yield* runtimeModules(
          "a.dom.ts",
          memory(
            {
              "a.dom.ts": [
                'import type { Option } from "effect";',
                'import { b } from "#plate/b.dom.ts";',
                'import { c } from "#plate/c.dom.ts";',
                '// import { x } from "effect";',
                // oxlint-disable-next-line no-template-curly-in-string -- Fixture source: the substitution belongs to the module under test.
                'export const text = "import { y } from \\"effect\\"" + `${b}import z from "effect"`;',
                'export const pattern = /import "effect"/u;',
                "export const a: number = b + c;",
                "",
              ].join("\n"),
              "b.dom.ts": 'import { a } from "#plate/a.dom.ts";\nexport const b: number = a;\n',
              "c.dom.ts": 'import { b } from "#plate/b.dom.ts";\nexport const c = b;\n',
            },
            reads,
          ),
        );

        assert.deepStrictEqual(
          modules.map((module) => module.id),
          ["a.dom.ts", "b.dom.ts", "c.dom.ts"],
        );
        assert.deepStrictEqual(reads, ["a.dom.ts", "b.dom.ts", "c.dom.ts"]);

        const [entry] = modules;

        assert.notInclude(entry?.source ?? "", "import type");
        assert.include(entry?.source ?? "", 'from "/runtime/b.dom.js"');
        assert.include(entry?.source ?? "", '// import { x } from "effect";');
      }),
  );

  it.effect(
    "[m3d-13] a module that cannot be read or stripped fails the walk with a typed error naming it",
    () =>
      Effect.gen(function* unreadable() {
        const missingModule = yield* Effect.flip(
          runtimeModules("a.dom.ts", memory({ "a.dom.ts": 'import "#plate/gone.dom.ts";\n' })),
        );
        const enumerated = yield* Effect.flip(
          runtimeModules("a.dom.ts", memory({ "a.dom.ts": "export enum A { B }\n" })),
        );
        const outside = yield* Effect.flip(
          runtimeModules("a.dom.ts", memory({ "a.dom.ts": 'import "#plate/../x.ts";\n' })),
        );

        assert.deepStrictEqual(
          missingModule._tag === "RuntimeModuleUnreadable" && missingModule.module,
          "gone.dom.ts",
        );
        assert.deepStrictEqual(
          enumerated._tag === "RuntimeModuleUnreadable" && enumerated.module,
          "a.dom.ts",
        );
        assert.include(enumerated.message, "a.dom.ts");
        assert.deepStrictEqual(
          outside._tag === "RuntimeImportRefused" && outside.specifier,
          "#plate/../x.ts",
        );
        assert.isTrue(Exit.isFailure(yield* Effect.exit(runtimeModules("a.dom.ts", memory({})))));
      }),
  );
});

describe("dev/page.ts: the opt-in runtime", () => {
  it.effect("[m3d-13] with the runtime off, every page and header is unchanged", () =>
    Effect.gen(function* off() {
      for (const handle of [
        createHandler(),
        createHandler({}),
        createHandler({ runtime: false }),
      ]) {
        const page = yield* fetched(handle, missing);
        const script = yield* fetched(handle, `${origin}/runtime/runtime.dom.js`);
        const boot = yield* fetched(handle, `${origin}${runtimeUrl(bootModule)}`);

        assert.strictEqual(page.status, 404);
        assert.deepStrictEqual(
          Object.fromEntries(page.headers),
          Object.fromEntries(Object.entries(pageHeaders)),
        );
        assert.strictEqual(
          page.headers.get("content-security-policy"),
          policyWithRuntime.replace("script-src 'self'", "script-src 'none'"),
        );
        assert.deepStrictEqual(elementsWith(parse(page.text), "script"), []);
        assert.strictEqual(script.status, 404);
        assert.strictEqual(boot.status, 404);
        assert.include(script.headers.get("content-type") ?? "", "text/html");
        assert.deepStrictEqual(elementsWith(parse(script.text), "script"), []);
      }
    }),
  );

  it.effect(
    "[m3d-13] with the runtime on, a page links the boot module and its policy admits script-src 'self' only",
    () =>
      Effect.gen(function* on() {
        const handle = createHandler({ runtime: true });
        const page = yield* fetched(handle, missing);
        const scripts = elementsWith(parse(page.text), "script");
        const [script] = scripts;

        assert.strictEqual(scripts.length, 1);
        assert.isDefined(script);

        const src = attributeOf(script, "src") ?? "";

        assert.strictEqual(attributeOf(script, "type"), "module");
        assert.isTrue(src.startsWith("/runtime/"));
        assert.strictEqual(src, runtimeUrl(bootModule));
        assert.strictEqual(script.childNodes.length, 0, "the script carries no inline code");
        assert.strictEqual(page.headers.get("content-security-policy"), policyWithRuntime);
        assert.deepStrictEqual(
          Object.fromEntries(page.headers),
          Object.fromEntries(
            Object.entries({ ...pageHeaders, "content-security-policy": policyWithRuntime }),
          ),
        );

        const boot = yield* fetched(handle, `${origin}${src}`);

        assert.strictEqual(boot.status, 200);
        assert.strictEqual(boot.headers.get("content-type"), "text/javascript; charset=utf-8");

        const sheet = yield* fetched(handle, `${origin}/styles.css`);

        assert.strictEqual(sheet.status, 200);
        assert.strictEqual(
          sheet.headers.get("content-security-policy"),
          pageHeaders["content-security-policy"],
        );
      }),
  );

  it.effect("[m3d-13] a path outside the graph under /runtime/ is a 404", () =>
    Effect.gen(function* outside() {
      const handle = createHandler({ runtime: true });
      const inside = yield* fetched(handle, `${origin}/runtime/runtime.dom.js`);

      assert.strictEqual(inside.status, 200);

      for (const target of [
        "/runtime/../payload.js",
        "/runtime/payload.js",
        "/runtime/%2e%2e/payload.js",
        "/runtime/..%2Fpayload.js",
        "/runtime/",
        "/runtime",
        "/runtime/runtime.dom.ts",
        "/runtime/dev/runtime-assets.js",
        "/runtime/dev/page.js",
        "/runtime/interactions/nothing.dom.js",
      ]) {
        const response = yield* fetched(handle, `${origin}${target}`);

        assert.strictEqual(response.status, 404, target);
        assert.include(response.headers.get("content-type") ?? "", "text/html", target);
      }

      assert.strictEqual(
        (yield* fetched(handle, `${origin}/runtime/runtime.dom.js`, "POST")).status,
        405,
      );
    }),
  );
});
