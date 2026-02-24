import { parseCSV } from "./csv-parser";
import { enqueue } from "./queue";
import "./worker"; // registers the queue subscriber

type Response = {
  ok: boolean;
  error?: string;
};

export class CallHandler {
  /**
   * Handle a batch of call records
   *
   * @param payload The raw batch of CDRs in CSV format.
   */
  public async handleBatch(payload: string): Promise<Response> {
    const { records, errors } = parseCSV(payload);

    if (errors.length > 0) {
      console.warn("[handler] parse errors:", errors);
    }

    if (records.length === 0) {
      return { ok: true };
    }

    enqueue({ records });

    return { ok: true };
  }
}
