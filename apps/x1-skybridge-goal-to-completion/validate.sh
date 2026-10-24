#!/usr/bin/env bash
set +e
cd /mnt/c/_Strategic_Minds_AI_OS/02_Active_Builds/X1_SKYBRIDGE_GOAL_RECEIPT_20261022 || exit 90
mkdir -p receipts
npx tsc --noEmit > receipts/types.log 2>&1
printf 'type_exit=%s\n' "$?" > receipts/gates.txt
node --import tsx --test tests/model.test.ts tests/integration.test.ts tests/worker-bridge.test.ts > receipts/tests.log 2>&1
printf 'test_exit=%s\n' "$?" >> receipts/gates.txt
npm run build > receipts/build.log 2>&1
printf 'build_exit=%s\n' "$?" >> receipts/gates.txt
npm audit --omit=dev --json > receipts/npm-audit.json 2>receipts/npm-audit-error.log
printf 'audit_exit=%s\n' "$?" >> receipts/gates.txt
printf 'dist_present=%s\n' "$(test -d dist && echo yes || echo no)" >> receipts/gates.txt
cat receipts/gates.txt
tail -n 17 receipts/build.log