#!/bin/sh
# Usage: scripts/bump_version.sh 4.7
# Single place to change the cache-busting version used by index.html and the service worker.
set -e
cd "$(dirname "$0")/.."
VERSION="$1"
case "$VERSION" in
  [0-9]*.[0-9]*) ;;
  *) echo "Usage: $0 <major.minor>  (e.g. 4.7)" >&2; exit 1 ;;
esac
sed -i '' -E "s/\?v=[0-9]+\.[0-9]+/?v=$VERSION/g" index.html
if [ -f sw.js ]; then
  sed -i '' -E "s/const CACHE_VERSION = \"[0-9]+\.[0-9]+\"/const CACHE_VERSION = \"$VERSION\"/" sw.js
fi
echo "Version set to $VERSION"
