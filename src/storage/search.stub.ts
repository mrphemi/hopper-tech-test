import { EnrichedCallRecord } from "../call-record.i";

// Production: Elasticsearch (or OpenSearch).
// Enables full-text and faceted search: filter by operator, country, region,
// time-range aggregations on call volume, cost analytics.

export class SearchIndexStub {
  async index(records: EnrichedCallRecord[]): Promise<void> {
    console.log(`[search] indexing ${records.length} record(s):`, records);
  }
}
