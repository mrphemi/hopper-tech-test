import { EnrichedCallRecord } from "../call-record.i";

// Production: PostgreSQL via `pg` or an ORM (Prisma / Drizzle).
// Relational model suits CDRs well: structured schema, duration/cost aggregations,
// range queries on callStartTime, joins on region/operator.

export class DatabaseStub {
  async insert(records: EnrichedCallRecord[]): Promise<void> {
    console.log(`[db] inserting ${records.length} record(s):`, records);
  }
}
