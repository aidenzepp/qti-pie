/**
 * The `./react` entry of `@qti-pie/plate`: the React layer, `src/react/index.tsx`. It is a `.tsx`
 * module, so only the DOM program (`src/tsconfig.json`) types it and the root program, which
 * excludes plate's `.tsx`, never pulls React or the DOM in.
 *
 * @module
 */
// oxlint-disable-next-line oxc/no-barrel-file -- The entry is the React surface: it loads exactly what src/react/index.tsx lists, React's closure included, as a package entry must.
export * from "#plate/react/index.tsx";
