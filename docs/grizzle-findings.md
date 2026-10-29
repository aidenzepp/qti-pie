# grizzle findings

Defects and limits found while building `packages/qti` on grizzle `1.0.0-beta.0` (`65203c4`). Each entry carries the
smallest reproduction and, once filed, its issue.

| Finding                                                                                                                       | Kind                 | Status                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------- |
| `test/unit/sql/audit.test.ts` fails on about 1 seed in 7: two coverage requirements go unreached                              | grizzle's test suite | [bjornpagen/grizzle#1](https://github.com/bjornpagen/grizzle/issues/1) |
| An insert through a query entry whose head fields are all serial is refused with `MalformedDescription`                       | Defect               | [bjornpagen/grizzle#2](https://github.com/bjornpagen/grizzle/issues/2) |
| A `numeric`'s display scale in a collapsed result depends on the plan                                                         | Question             | [bjornpagen/grizzle#3](https://github.com/bjornpagen/grizzle/issues/3) |
| `listedBackend` found no `pg_stat_activity` row for a `psql` writer in `races-alternatives`, once, under the full network run | Unconfirmed          | Not filed: seen once, passes alone                                     |

The first three came from grizzle's own test suites, before this package existed.
