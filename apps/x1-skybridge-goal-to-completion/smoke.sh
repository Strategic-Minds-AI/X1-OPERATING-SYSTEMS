#!/usr/bin/env bash
set -uo pipefail
cd /mnt/c/_Strategic_Minds_AI_OS/02_Active_Builds/X1_SKYBRIDGE_GOAL_RECEIPT_20261022 || exit 91
mkdir -p receipts
./node_modules/.bin/skybridge dev --port 3217 --plain --no-open > receipts/dev.log 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null || true; wait "$SERVER" 2>/dev/null || true' EXIT
READY=0
for i in $(seq 1 75); do
  if curl --max-time 2 --fail -s http://127.0.0.1:3217/ -o receipts/devtools.html; then READY=1; break; fi
  if ! kill -0 "$SERVER" 2>/dev/null; then break; fi
  sleep 1
done
if [ "$READY" != "1" ]; then
  echo "devtools_http=FAIL" | tee receipts/mcp-gate.txt
  tail -n 35 receipts/dev.log
  exit 2
fi
echo "devtools_http=PASS" > receipts/mcp-gate.txt
node tests/mcp-smoke.mjs > receipts/mcp-smoke.log 2>&1
CODE=$?
echo "mcp_smoke_exit=$CODE" >> receipts/mcp-gate.txt
tail -n 25 receipts/mcp-smoke.log
exit "$CODE"