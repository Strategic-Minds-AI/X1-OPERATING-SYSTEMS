# X1 OMNI local durable-job canary — dispatch evidence
Date: 2026-10-21
Source: JARVIS-COMMAND Remote Desktop Commander, authorized local only.

## Verified
- User re-ran `smoke_test.py`: pass=7 fail=0; mission ID `X1-D96AB72B568B656A`; receipt `C:\_Strategic_Minds_AI_OS\70_X1_GPT_INFINITY_SYSTEM\09_PROJECT_BOOTSTRAPS\X1_OMNI_FACTORY_20261021\JARVIS_SMOKE_RECEIPT.json`.
- Canonical local runner source verified: `07_Infrastructure/workstation/durable-jobs/scripts/durable-job-start.ps1`. Its child worker invokes PowerShell .ps1 scripts with pwsh -File. It is the existing local durable execution system; no new scheduler created.
- Safe PowerShell wrapper deployed from this branch at `docs/x1-omni-factory/src/durable-canary.ps1` to the canonical JARVIS OMNI folder; remote SHA-256 `EE921466B0E73622122C88EFDA196EF6C824E0D721E042ADC052B9AC4D885BA1` obtained after download.
- The canonical launcher returned **dispatch_status=DISPATCHED** with job ID `X1OMNI-DURABLE-20261021-A1`, worker PID 43552, action class LOCAL_REVERSIBLE_WRITE, retry_budget=0, max_attempts=1, watchdog existing `StrategicMinds-JARVIS-Reconcile-5m`.
- State expected: `C:\_Strategic_Minds_AI_OS\07_Infrastructure\workstation\durable-jobs\state\X1OMNI-DURABLE-20261021-A1.json`
- Receipt expected: `C:\_Strategic_Minds_AI_OS\07_Infrastructure\workstation\durable-jobs\receipts\X1OMNI-DURABLE-20261021-A1.receipt.json`
- Terminal expected: `C:\_Strategic_Minds_AI_OS\07_Infrastructure\workstation\durable-jobs\events\X1OMNI-DURABLE-20261021-A1.terminal.json`

## Not verified
- Detached completion receipt and terminal-event readback: REMOTE READ PENDING/TIMED OUT; no PASS claimed.
- Supabase staging queue-to-worker test: NOT SUBMITTED. Existing JARVIS Supabase heartbeat remains historically ONLINE/SENSOR_ONLY with lease_requested=false; fresh worker ACK, lease and independent Guardian receipt remain unverified.
- No live website build, external messages, live charges, domain or production changes.

## Resume safely
Read the exact receipt and terminal-event JSON once, without relaunching the job or waiting on a live stream. If completed PASS, invoke a separately authorized staging-only X1 queue submission contract test, then independently validate task ACK/lease/ledger/Guardian against the exact SHA. Do not enable a second scheduler or relax auth. If completed FAIL, inspect its stdout/stderr and exact failure fingerprint before a bounded repair. The test wrapper is not the persistent Supabase job worker.
