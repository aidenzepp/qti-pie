# crust

> *A good crust is flaky. This one isn't.*
>
> crust reads the dough: it turns QTI's XML into a tree and bakes it back out, byte for byte.

Read and write XML exactly as it was written.

## Modules

Each is a file in `src/` and an entry in the `"exports"` map.

- `read.ts`: `readXml`, bytes to an `XmlDocument`.
- `tree.ts`: the immutable `XmlDocument` shape every other module reads and writes.
- `errors.ts`: the tagged errors, `WellFormednessError`, `ReaderRefusal` and `EncodeError`.
- `canonical.ts`: `canonicalize`, a document's canonical bytes.
- `charset.ts`: how a label's characters become bytes, and which labels can be written.
- `encode.ts`: one encoder per charset class.
- `write.ts`: `writeXml`, an `XmlDocument` back to bytes.

## Use

In the consumer's `package.json`:

```json
"dependencies": { "@qti-pie/crust": "workspace:*" }
```

```ts
import { readXml } from "@qti-pie/crust/read.ts";
```

A file the `"exports"` map does not list, such as `@qti-pie/crust/decode.ts`, fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## Dependencies

crust depends on `effect` and `saxes` and nothing else, so grizzle and any database client stay out of whatever depends
on it.
