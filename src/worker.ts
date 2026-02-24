import { enrichAll } from "./enrichment-service";
import { subscribe } from "./queue";
import { DatabaseStub } from "./storage/db.stub";
import { SearchIndexStub } from "./storage/search.stub";

const db = new DatabaseStub();
const search = new SearchIndexStub();

subscribe(async (job) => {
  try {
    const enriched = await enrichAll(job.records);
    await Promise.all([db.insert(enriched), search.index(enriched)]);
  } catch (err) {
    console.error("[worker] failed to process job:", err);
  }
});
