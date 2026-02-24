# Solution

## Context

A telecommunications analytics platform that processes **Call Detail Records (CDRs)** from telecom providers. The system must ingest batches of raw call data, enrich each record with operator/country metadata, and persist to a database and search index.

## Core Constraint

**Sub-500ms acknowledgement SLA.** Upstream systems send CSV batches and expect a receipt confirmation within 500ms. This is the primary driver of the architecture.

## Deliverables

Implement the body of `CallHandler.handleBatch(payload: string)` — the entry point that receives a raw CSV string and returns `{ ok: boolean; error?: string }`.

The full processing pipeline is:

```
Incoming CSV
    │
    ▼
Parse & Validate CSV                ← fast, synchronous
    │
    ├─ empty/invalid → return error immediately
    │
    ▼
Acknowledge receipt (< 500ms)       ← key SLA
    │
    ▼
Enrich each record (async)
    ├─ lookup fromNumber operator
    ├─ lookup toNumber operator
    └─ calculate duration + estimatedCost
    │
    ▼
Store enriched records
    ├─ Database (e.g. PostgreSQL)
    └─ Search index (e.g. Elasticsearch)
```

## Data Flow Diagram

```
HTTP Request (CSV payload)
        │
        ▼
 ┌──────────────────┐
 │   CallHandler    │  parse + validate → enqueue → { ok: true }
 └──────────┬───────┘
            │ enqueue
            ▼
 ┌──────────────────┐
 │   In-Memory      │  (prod: BullMQ + Redis / AWS SQS)
 │   Job Queue      │
 └──────────┬───────┘
            │ dequeue
            ▼
 ┌──────────────────┐
 │     Worker       │
 │                  │
 │  ┌────────────┐  │
 │  │ Enrichment │  │  Promise.allSettled per record (from + to lookups)
 │  │  Service   │  │
 │  └────────────┘  │
 │                  │
 │  ┌────┐ ┌──────┐ │
 │  │ DB │ │Search│ │  parallel write to both sinks
 │  └────┘ └──────┘ │
 └──────────────────┘
```

## Technology Choices

| Concern | Implementation | Production recommendation |
|---------|---------------|--------------------------|
| CSV parsing | Naive `split(',')` — sufficient for well-formed CDR data | `csv-parse` — battle-tested, handles quoted fields and edge cases |
| Date formatting | `dayjs` — `formatDate()` converts ISO 8601 → `yy-MM-dd` | Same |
| Job queue | In-memory `EventEmitter` — synchronous dispatch, zero dependencies | BullMQ + Redis (persistence, retries, concurrency) |
| Enrichment | `Promise.allSettled` — parallel from/to lookups per record, partial enrichment on failure | Add retry with exponential backoff for the ~5% transient failure rate |
| Database | `DatabaseStub` — logs records to console | PostgreSQL — It works |
| Search index | `SearchIndexStub` — logs records to console | Elasticsearch — full-text / Postgres has full text search capabilities too |
| Testing | Vitest | Same |

