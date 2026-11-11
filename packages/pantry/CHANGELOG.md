# Changelog

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
- `db/install.ts` holds only `MediaPolicySchema` and `MediaPolicy`; an extension is at most 127 characters.
- New exports: `qti/media.ts`, `import/program.ts`, `import/refusal.ts`, `vocab/laws.ts` and `db/served.ts`
  (`AuthorLogin`). `"sideEffects": false`.
- One migration, regenerated from zero: `migrations/qti/<timestamp>_sterling-standard`.
