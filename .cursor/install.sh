#!/usr/bin/env bash
# The cloud environment's install step. Idempotent. Runs from the repository root on an Ubuntu machine with
# passwordless sudo. It installs Node 26.13.0, pnpm 12.16.1, the workspace, Playwright's Chromium headless shell
# and WebKit with their system libraries, and the public caches plate's tests read under $HOME/.cache/gr8des.
# It writes nothing into the repository.
set -euo pipefail

log() { printf '[install] %s\n' "$*"; }

# 1. Node 26.13.0 (the workspace's devEngines runtime). The image may carry an older node ahead of /usr/local on PATH,
#    so node 26 goes into /usr/local/node26 and its bin goes first on PATH for this shell and every later one.
if [ ! -x /usr/local/node26/bin/node ] || ! /usr/local/node26/bin/node -v | grep -q '^v26\.13\.0$'; then
  arch="$(uname -m)"
  case "$arch" in x86_64) a=x64 ;; aarch64 | arm64) a=arm64 ;; *) echo "unsupported arch $arch" >&2; exit 1 ;; esac
  log "installing node 26.13.0 ($a)"
  sudo mkdir -p /usr/local/node26
  curl -fsSL "https://nodejs.org/dist/v26.13.0/node-v26.13.0-linux-$a.tar.xz" | sudo tar -xJ -C /usr/local/node26 --strip-components=1
fi
line='export PATH="/usr/local/node26/bin:$PATH"'
for rc in "$HOME/.bashrc" "$HOME/.profile"; do
  grep -qxF "$line" "$rc" 2>/dev/null || printf '%s\n' "$line" >>"$rc"
done
printf '%s\n' "$line" | sudo tee /etc/profile.d/node26.sh >/dev/null
export PATH="/usr/local/node26/bin:$PATH"
bash -lc 'node -v' | grep -q '^v26\.' || { echo "a fresh login shell does not run node 26" >&2; exit 1; }
log "node $(node -v)"

# 2. pnpm 12.16.1.
if ! command -v pnpm >/dev/null 2>&1 || ! pnpm -v | grep -q '^12\.16\.1$'; then
  log "installing pnpm 12.16.1"
  sudo env "PATH=$PATH" npm install -g pnpm@12.16.1 >/dev/null
fi
log "pnpm $(pnpm -v)"

# 3. unzip and git-lfs, then the LFS files (best effort).
if ! command -v unzip >/dev/null 2>&1 || ! command -v git-lfs >/dev/null 2>&1; then
  sudo apt-get update -qq && sudo apt-get install -y -qq unzip git-lfs >/dev/null
fi
git lfs install --skip-repo >/dev/null 2>&1 || true
if git lfs pull >/dev/null 2>&1; then log "lfs pulled"; else log "lfs pull skipped"; fi

# 4. The workspace, with exactly one copy of effect.
pnpm install --frozen-lockfile
pnpm why effect -r | grep -x 'Found 1 version of effect'

# 5. Browsers into $HOME/.cache/gr8des/ms-playwright, and their system libraries.
export PLAYWRIGHT_BROWSERS_PATH="$HOME/.cache/gr8des/ms-playwright"
pnpm --filter @qti-pie/plate browsers
sudo -E env "PATH=$PATH" pnpm --filter @qti-pie/plate exec playwright-core install-deps chromium webkit

# 6. The caches plate's unit tests read.
bash packages/plate/scripts/cloud/fetch-caches.sh

log "done"
