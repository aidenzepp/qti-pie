#!/bin/sh
# qti for the anc linter: the CLI with the database pointed at nothing, run from a scratch folder.
here=$(cd "$(dirname "$0")/.." && pwd) || exit 1
export GRIZZLE_PG_STATE=/nonexistent/anc-probe
export GR8DES_PG_SECRETS=/nonexistent/anc-probe
export GR8DES_PG_PORT=1
mkdir -p "$here/work/anc/run" && cd "$here/work/anc/run" || exit 1
exec "$here/../../node_modules/.bin/node" "$here/src/cli.ts" "$@"
