# X1 Infinity MCP Gateway — staging candidate

**Mission**: X1-INFINITY-FULL-STACK-AUTONOMOUS-BUILD-001  
**Branch**: feature/x1-five-mcp-gateway-20261021  
**Source parent**: ad62c0964e026d54cb011fc7dc25a8be1333931e  
**Status**: implementation candidate only. No live provider adapter or worker canary certified.

One Model Context Protocol TypeScript SDK v2 Streamable HTTP endpoint at `/mcp`, offering 12 strictly allowlisted tools across five capability groups:
- supergpt: inventory, mission_plan, job_status
- website: template_inventory, preview_prepare, preview_status
- search: site_audit, analytics_report
- social: campaign_draft, performance_report
- revenue: opportunities_report, proposal_draft

This package **does not create another scheduler, database, queue, token or deploy service**. Each call requires an independently verified JWT and a tenant/capability authorization decision from the existing X1 authority. Each call reaches only a configured server-side adapter with dry-run set true, environment staging and publication disabled. If an adapter is missing it fails closed with BLOCKED; it never invents a build receipt.

## Configure (do not paste secrets or publish tokens)
Environment variables: `X1_JWKS_URL`, `X1_JWT_ISSUER`, `X1_JWT_AUDIENCE`, `X1_AUTHZ_URL`, `X1_ADAPTER_BASE_URL`, `X1_ADAPTER_SERVICE_TOKEN`, `X1_ALLOWED_ORIGINS`, `HOST`, `PORT`. The adapter must validate tenant, actor, source SHA, idempotency and permissions itself. There is no direct Supabase service-role token in an MCP client.

```sh
cd packages/x1-mcp-gateway
npm install --ignore-scripts --no-audit --no-fund
npm run check
HOST=127.0.0.1 npm start
```

The server listens on loopback by default. Set HOST=0.0.0.0 only inside an independently authenticated and reviewed staging network, behind TLS and resource-bound OAuth/JWT validation. The authz endpoint must respond `{allowed:true, actor_id, tenant_id, capability}` matching the request exactly. The internal adapter contracts must be implemented against the existing X1 control plane, Launch Engine, SEO Generator, Auto Social and Digital Dominance; this commit does NOT assert they exist.

## Release gates
1. Review current branch SHA and merge conflict with PR #32.
2. Pin dependencies in a reviewed lockfile before deployment. Package versions are pinned in package.json but no lockfile is present yet.
3. Run tests/typecheck. Capture exact logs.
4. Validate unauthorized/mismatched-tenant/cross-tenant negatives against real X1 membership and token service.
5. Implement and read-back server adapters in staging; fix queue authorization failures without bypass.
6. Run single noindex synthetic site through existing worker, capture lease and immutable job receipt.
7. Run independent Guardian/browser/form/RLS/SEO QA. Require 95+ AND all hard gates, maximum three repair rounds.
8. Seek target-specific owner approval before production, DNS, public publishing, spend or customer messages.

**Current known staging backlog (observed live 2026-10-21):** 59 COMPLETED, 20 DEAD_LETTER, 17 BLOCKED. These are not caused or repaired by this package. No production changes authorized.
