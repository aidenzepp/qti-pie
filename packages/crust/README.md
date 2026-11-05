# crust

> *A good crust is flaky. This one isn't.*
>
> crust reads the dough: it turns QTI's XML into a tree and bakes it back out, byte for byte.

Read and write XML exactly as it was written.

crust turns bytes into an immutable XML tree and a tree back into bytes. It is the shared reader and writer for the
other packages in [qti-pie](../../README.md). It does not know QTI, and it has no database or grizzle dependency:
its dependencies are `effect` and `saxes`.

## Install

crust is a private workspace package. In a sibling package's `package.json`:

```json
"dependencies": { "@qti-pie/crust": "workspace:*" }
```

Then run `pnpm install` from the repository root.

## Start

```ts
import { readXml } from "@qti-pie/crust/read.ts";
import { writeXml } from "@qti-pie/crust/write.ts";
```

`readXml` takes bytes and returns an `XmlDocument`. `writeXml` takes an `XmlDocument` and returns bytes. Each reports
its failures as the tagged errors that `errors.ts` defines.

Import only the files listed in the `"exports"` map of `package.json`. Any other path, such as
`@qti-pie/crust/decode.ts`, fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## Development

From the repository root:

```bash
pnpm check
pnpm --filter @qti-pie/crust test
```

Tests sit beside the code they test. Agents start at [`AGENTS.md`](../../AGENTS.md).

## License

MIT
