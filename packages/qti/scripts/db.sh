#!/usr/bin/env bash
# The QTI package's local database on grizzle's development cluster (grizzle's scripts/pg: pnpm pg:build, pg:init).
#
#   scripts/db.sh create    create the database from grizzle_template, owned by the migration identity
#   scripts/db.sh migrate   grizzle migrate, then give each of this package's logins its local password
#   scripts/db.sh reset     drop the database and this package's PostgreSQL roles, then create and migrate again
#
# Roles are cluster-wide, so reset drops the roles of every schema under migrations/ along with the database.
set -euo pipefail
cd "$(dirname "$0")/.."

: "${GRIZZLE_PG_STATE:=$HOME/.local/var/grizzle/pg19rc1}"
: "${GRIZZLE_PG_BIN:=$HOME/.local/opt/postgresql/19rc1/bin}"
: "${GR8DES_PG_HOST:=localhost}"
: "${GR8DES_PG_PORT:=5433}"
: "${GR8DES_PG_DATABASE:=gr8des_qti}"
: "${GR8DES_PG_SECRETS:=$HOME/.local/var/gr8des/$GR8DES_PG_DATABASE}"

owner=grizzle_dev
ca="$GRIZZLE_PG_STATE/tls/ca.crt"
owner_password="$(cat "$GRIZZLE_PG_STATE/$owner.password")"

# Usage: as_owner <database> [psql args...]
as_owner() {
	local db=$1
	shift
	PGPASSWORD="$owner_password" "$GRIZZLE_PG_BIN/psql" -X -q -v ON_ERROR_STOP=1 -At \
		"host=$GR8DES_PG_HOST port=$GR8DES_PG_PORT dbname=$db user=$owner sslmode=verify-full sslrootcert=$ca" "$@"
}

# The snake_case schema names this package installs, one per folder under migrations/.
schemas() {
	find migrations -mindepth 1 -maxdepth 1 -type d -exec basename {} \; 2>/dev/null | sort
}

create() {
	if [[ -n "$(as_owner postgres -c "SELECT 1 FROM pg_database WHERE datname = '$GR8DES_PG_DATABASE'")" ]]; then
		echo "$GR8DES_PG_DATABASE: exists"
		return
	fi
	as_owner postgres -c "CREATE DATABASE $GR8DES_PG_DATABASE OWNER $owner TEMPLATE grizzle_template"
	echo "$GR8DES_PG_DATABASE: created"
}

migrate() {
	DATABASE_URL="postgresql://$owner@$GR8DES_PG_HOST:$GR8DES_PG_PORT/$GR8DES_PG_DATABASE?sslrootcert=$ca" \
		PGPASSWORD="$owner_password" pnpm exec grizzle migrate
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

reset() {
	as_owner postgres -c "DROP DATABASE IF EXISTS $GR8DES_PG_DATABASE WITH (FORCE)"
	local schema role
	for schema in $(schemas); do
		for role in $(as_owner postgres -c "SELECT rolname FROM pg_roles WHERE rolname LIKE '${schema}\_\_%' ORDER BY rolcanlogin DESC, 1"); do
			as_owner postgres -c "DROP ROLE $role"
		done
	done
	create
	migrate
}

case "${1:-}" in
	create) create ;;
	migrate) migrate ;;
	reset) reset ;;
	*)
		echo "usage: scripts/db.sh create|migrate|reset" >&2
		exit 2
		;;
esac
