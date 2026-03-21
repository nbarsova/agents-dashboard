## Testing Strategy

### Unit Tests

**Scope:** Individual functions and modules in isolation.

| Area              | What to Test                                   | Examples                                                                                   |
|-------------------|------------------------------------------------|--------------------------------------------------------------------------------------------|
| Pricing engine    | Cost calculation logic for both pricing models | Token cost = tokens × rate; session usage % at boundary values (0%, 80%, 100%, over-limit) |
| Aggregation logic | Time-bucketing, grouping, rollup calculations  | Daily aggregation with timezone edge cases; empty periods return zero not null             |
| RBAC middleware   | Role-to-permission mapping                     | Member cannot access org-wide endpoints; admin can; invalid tokens rejected                |
| Channel detection | Invocation source tagging                      | Each channel type resolves correctly; unknown channel falls back to `"api"`                |

### Integration Tests

**Scope:** Service-to-database and service-to-service interactions with real dependencies (no mocks for data stores).

| Area               | What to Test                                                                                                            |
|--------------------|-------------------------------------------------------------------------------------------------------------------------|
| Event pipeline     | Event emitted → queued → processed → queryable in OLAP store. Verify dedup (same `id` twice → one record) |
| Analytics API → DB | Query with filters (date range, agent, user, channel) returns correct aggregations against seeded data    |
| Auth flow          | Signup → create org → invite member → member accepts → member has correct role and data access                     |
| Pricing display    | Org on token plan sees cost columns; org on seat plan sees session gauges; switching plans updates dashboard |
| KPI CRUD           | Create KPI → link to agent → query agent detail → KPI appears in response                                           |

### RBAC / Authorization Tests

Dedicated test suite — this is the highest-risk area for data leaks between orgs.

| Scenario | Expected |
|----------|----------|
| Member queries `/orgs/:orgId/analytics/overview` | 403 Forbidden |
| Member queries `/me/analytics` | Only own runs returned |
| Admin of Org A queries Org B's analytics | 403 Forbidden |
| Admin queries org analytics | All org members' runs returned |
| Unauthenticated request to any analytics endpoint | 401 Unauthorized |
| Member attempts KPI create/edit/delete | 403 Forbidden |

### End-to-End Tests

**Scope:** Full user flows through the browser against a staging environment.

| Flow | Steps |
|------|-------|
| Admin overview | Login as admin → navigate to org dashboard → verify charts render with correct data → change time period → verify data updates |
| Agent detail drill-down | Org overview → click agent → expandable rows load → filter by user → results narrow correctly |
| Member personal view | Login as member → see only own usage → verify no other users' data is visible → session limit gauge reflects actual usage |
| KPI setup | Admin → KPI config → create KPI → link to agent → navigate to agent detail → KPI trend overlay visible |

### Performance / Load Tests

| Scenario | Target | Tool |
|----------|--------|------|
| Dashboard load (org with 50K events/month) | < 200ms p95 for aggregated queries | k6 / Artillery |
| Dashboard load (org with 1M events/month) | < 500ms p95 with pre-aggregated rollups | k6 / Artillery |
| Concurrent admin users (100 orgs, 5 admins each) | No query degradation; connection pool holds | k6 |
| Event ingestion burst (10K events/second) | No event loss; pipeline backpressure works | Custom producer script |

### Data Integrity Tests

| Scenario | Validation |
|----------|-----------|
| Aggregation accuracy | Sum of individual run tokens = aggregated total for same period (reconciliation query) |
| Rollup consistency | Hourly rollups sum to daily; daily rollups sum to monthly (within floating-point tolerance) |
| Cross-org isolation | Run seeded data for Org A and Org B; query as Org A admin; assert zero Org B data in response |
| Event dedup | Replay same events; assert no duplicate records in OLAP store |

### CI Pipeline

```
PR merge → lint + type-check
        → unit tests (parallel, ~30s)
        → integration tests (dockerized DB dependencies, ~2min)
        → RBAC test suite (~30s)
        → e2e tests against ephemeral staging (~5min)
        → deploy to staging
```

Performance and load tests run nightly, not on every PR — they're slow and infrastructure-dependent.
