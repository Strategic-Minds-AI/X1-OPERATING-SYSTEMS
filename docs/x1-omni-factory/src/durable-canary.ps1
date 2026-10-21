# X1 OMNI local durable canary — bounded, no external dispatch
# Existing runner invokes .ps1 with pwsh -File.
$ErrorActionPreference='Stop'
$root='C:\_Strategic_Minds_AI_OS\70_X1_GPT_INFINITY_SYSTEM\09_PROJECT_BOOTSTRAPS\X1_OMNI_FACTORY_20261021'
& python (Join-Path $root 'smoke_test.py')
if($LASTEXITCODE -ne 0){throw 'Smoke test failed'}
$r=Get-Content -LiteralPath (Join-Path $root 'JARVIS_SMOKE_RECEIPT.json') -Raw | ConvertFrom-Json
if($r.pass -ne 7 -or $r.fail -ne 0 -or $r.real_queue_submitted){throw 'Expected synthetic 7/7, no live queue activity'}
Write-Output 'X1_OMNI_LOCAL_DURABLE_CANARY_PASS_7_OF_7'
exit 0
