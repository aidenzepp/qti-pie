# Changelog

## Unreleased: replace by set difference

An import replaces the package stored under its manifest identifier. Breaking changes:

- `importWrite` (`qti/logins.ts`) is removed. `replaceWrite` takes its place in `AuthorApp`'s and `MediaAuthorApp`'s
  workloads: one ChangeSet that deletes each top relation's rows stored under the parameter `package` and inserts the
  package's rows, which grizzle plans as one set difference, so the rows both hold stay untouched. An application
  applies it as `db.workload.replaceWrite.apply({ insert: rows.insert }, { package: rows.package })`.
- `importPackage` (`import/package.ts`) writes every import through `replaceWrite`, and its outcome gains `replaced`:
  a changed package under a stored identifier, once refused on `Package`'s key. Its workload takes `replaceWrite` and
  `entryDigestsOf` in place of `importWrite` and `packageOf`.
- New read in `authorReads`: `entryDigestsOf`, each entry's path and digest by the package's manifest identifier. An
  import whose commit got no answer reads it back and compares it with the package's entries, since the `Package` row
  stands before and after a replace.
- `qti import` prints `replaced` for a changed package, and `--output json`'s `outcome` (`schema/import.json`) gains
  `"replaced"`.
- The one migration is regenerated from zero, its served file holding `replaceWrite` and `entryDigestsOf`.

## Unreleased: just grizzle

pantry's API is plain grizzle values. Breaking changes:

- `Qti` is one schema constant (`qti/schema.ts`). `qtiSchema(policy)` and `qtiLevelsOf(policy)` take no policy: a
  call with `Option.some(policy)` is a type error. `QtiSchema`, `authorAppOf`, `authorRoleOf`, `authorWorkloadsOf`
  and `exportQueriesOf` stay callable and return `Qti`'s one value.
- The package-media laws are a level, `QtiMedia` (`qti/media.ts`), stacked with `schema.extend`. The policy is data:
  `MediaType` rows (`extension`, `type`, one extension per type) in the level `QtiMediaPolicy`, which an application
  writes. `Attribute` gains three generated columns its laws read (`data_scheme`, `data_token`, `style_fetch`).
- `importRowsOf(pkg)` (`import/program.ts`) returns `{ insert, packageId }` for `importWrite`, so an application
  writes a package with its own `Db`. `importPackage` stays, built on it.
- `migrationConnection`, `loginConnection` and `primedLoginConnection` (`db/connection.ts`), and `ImportLive` and
  `AuthorAppLayer` (`db/layer.ts`), are no longer exported: the `"exports"` map lists neither module, which the
  command line and the tests alone import. `connectionServices`, `servedPathOf`, `QtiInstall`, `installFolder`,
  `readInstall`, `InstallPolicyError` and `installedPolicy` are deleted, and `GR8DES_QTI_INSTALL` is read nowhere.
- `db/install.ts` holds only the media policy file's schema: `MediaExtension`, `MediaType`, `MediaPolicySchema` and
  `MediaPolicy`; an extension is at most 127 characters.
- New exports: `qti/media.ts`, `import/program.ts`, `import/refusal.ts`, `vocab/laws.ts` and `db/served.ts`
  (`AuthorLogin`). `"sideEffects": false`.
- One migration, regenerated from zero: `migrations/qti/<timestamp>_sterling-standard`.
- New export: `documentScanOf(document)` (`export/scan.ts`), `documentScan`'s arms over a document term an
  application's attachment mints, unpaged: `.attach("document", (served) => documentScanOf(served.item), "array")`.
  `documentScan`'s served SQL is unchanged.
