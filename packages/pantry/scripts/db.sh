#!/usr/bin/env bash
# The QTI package's local database on grizzle's development cluster (grizzle's scripts/pg: pnpm pg:build, pg:init).
#
#   scripts/db.sh create    create the database from grizzle_template, owned by the migration identity
#   scripts/db.sh migrate   grizzle migrate, then give each of this package's logins its local password
#   scripts/db.sh reset     drop, then create and migrate again
#   scripts/db.sh drop      drop the database, this package's PostgreSQL roles and the password directory
#   scripts/db.sh check-clear  list roles and gr8des_qti databases this one does not own; exit 1 if any, else 0
#
# Roles are cluster-wide, so drop removes the roles of every schema under the config's migrations/ along with the
# database.
# GR8DES_PG_DATABASE must match ^[a-z_][a-z0-9_]{0,62}$ (lowercase, at most 63 bytes), or every command exits 2.
# GR8DES_GRIZZLE_CONFIG names the grizzle config migrate runs (grizzle.config.ts by default), whose migrations
# directory is the folder migrations/ beside it.
set -euo pipefail
cd "$(dirname "$0")/.."

# The GR8DES_PG_* and GRIZZLE_PG_STATE defaults below are read again, with the same values, by `localCluster` in
# src/db/connection.ts; change one, change both. They are exported, so the grizzle config connects where this script
# does.
: "${GRIZZLE_PG_STATE:=$HOME/.local/var/grizzle/pg19rc1}"
: "${GRIZZLE_PG_BIN:=$HOME/.local/opt/postgresql/19rc1/bin}"
: "${GR8DES_PG_HOST:=localhost}"
: "${GR8DES_PG_PORT:=5433}"
: "${GR8DES_PG_DATABASE:=gr8des_qti}"
: "${GR8DES_PG_SECRETS:=$HOME/.local/var/gr8des/$GR8DES_PG_DATABASE}"
: "${GR8DES_PG_CA:=$GRIZZLE_PG_STATE/tls/ca.crt}"
: "${GR8DES_PG_MIGRATION_ROLE:=grizzle_dev}"
export GRIZZLE_PG_STATE GR8DES_PG_HOST GR8DES_PG_PORT GR8DES_PG_DATABASE GR8DES_PG_SECRETS GR8DES_PG_CA GR8DES_PG_MIGRATION_ROLE
config="${GR8DES_GRIZZLE_CONFIG:-grizzle.config.ts}"
migrations="$(dirname "$config")/migrations"

if ! [[ $GR8DES_PG_DATABASE =~ ^[a-z_][a-z0-9_]{0,62}$ ]]; then
	echo "GR8DES_PG_DATABASE is '$GR8DES_PG_DATABASE'; use 1 to 63 lowercase letters, digits or underscores, not starting with a digit (create folds an unquoted name to lowercase, but migrate connects as written)." >&2
	exit 2
fi

owner="$GR8DES_PG_MIGRATION_ROLE"
ca="$GR8DES_PG_CA"
owner_password="$(cat "$GRIZZLE_PG_STATE/$owner.password")"

# Usage: as_owner <database> [psql args...]
as_owner() {
	local db=$1
	shift
	PGPASSWORD="$owner_password" "$GRIZZLE_PG_BIN/psql" -X -q -v ON_ERROR_STOP=1 -At \
		"host=$GR8DES_PG_HOST port=$GR8DES_PG_PORT dbname=$db user=$owner sslmode=verify-full sslrootcert=$ca" "$@"
}

# The snake_case schema names the config installs, one per folder under its migrations/.
schemas() {
	find "$migrations" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; 2>/dev/null | sort
}

create() {
	if [[ -n "$(as_owner postgres -c "SELECT 1 FROM pg_database WHERE datname = '$GR8DES_PG_DATABASE'")" ]]; then
		echo "$GR8DES_PG_DATABASE: exists"
		return
	fi
	as_owner postgres -c "CREATE DATABASE $GR8DES_PG_DATABASE OWNER $owner TEMPLATE grizzle_template"
	echo "$GR8DES_PG_DATABASE: created"
}

# grizzle reads no environment variable for where to connect: the config's connection (src/db/connection.ts) reads
# the settings exported above and the migration identity's password, which only this command is given.
migrate() {
	GR8DES_PG_MIGRATION_PASSWORD="$owner_password" pnpm exec grizzle migrate "$config"
	mkdir -p "$GR8DES_PG_SECRETS"
	chmod 700 "$GR8DES_PG_SECRETS"
	local schema login file
	for schema in $(schemas); do
		for login in $(as_owner postgres -c "SELECT rolname FROM pg_roles WHERE rolcanlogin AND rolname LIKE '${schema}\_\_%' ORDER BY 1"); do
			file="$GR8DES_PG_SECRETS/$login.password"
			[[ -f "$file" ]] || (umask 077 && openssl rand -hex 24 > "$file")
			as_owner postgres -c "ALTER ROLE $login PASSWORD '$(cat "$file")'"
			echo "$login: password in $file"
		done
	done
}

drop() {
	as_owner postgres -c "DROP DATABASE IF EXISTS $GR8DES_PG_DATABASE WITH (FORCE)"
	local schema role
	for schema in $(schemas); do
		for role in $(as_owner postgres -c "SELECT rolname FROM pg_roles WHERE rolname LIKE '${schema}\_\_%' ORDER BY rolcanlogin DESC, 1"); do
			as_owner postgres -c "DROP ROLE $role"
		done
	done
	rm -rf "$GR8DES_PG_SECRETS"
}

reset() {
	drop
	create
	migrate
}

# Prints each leftover as "role: <name>" or "database: <name>"; exits 1 if any were found.
check_clear() {
	local schema where="rolname LIKE 'qti\_\_%' OR rolname LIKE 'qti_smoke\_\_%'"
	for schema in $(schemas); do
		where="$where OR rolname LIKE '${schema}\_\_%'"
	done
	local found
	found="$(
		as_owner postgres -c "SELECT 'role: ' || rolname FROM pg_roles WHERE $where ORDER BY rolname"
		as_owner postgres -c "SELECT 'database: ' || datname FROM pg_database WHERE datname LIKE 'gr8des_qti%' AND datname <> '$GR8DES_PG_DATABASE' ORDER BY datname"
	)"
	if [[ -n "$found" ]]; then
		echo "$found"
		return 1
	fi
}

case "${1:-}" in
	create) create ;;
	migrate) migrate ;;
	reset) reset ;;
	drop) drop ;;
	check-clear) check_clear ;;
	*)
		echo "usage: scripts/db.sh create|migrate|reset|drop|check-clear" >&2
		exit 2
		;;
esac
