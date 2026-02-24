import { CallRecord, EnrichedCallRecord } from "./call-record.i";
import { lookupOperator } from "./operator-lookup";
import { formatDate } from "./utils/date-formatter";

export async function enrichRecord(
  record: CallRecord,
): Promise<EnrichedCallRecord> {
  const duration =
    (new Date(record.callEndTime).getTime() -
      new Date(record.callStartTime).getTime()) /
    1000;

  const callDate = formatDate(record.callStartTime);

  const [fromResult, toResult] = await Promise.allSettled([
    lookupOperator(record.fromNumber, callDate),
    lookupOperator(record.toNumber, callDate),
  ]);

  if (fromResult.status === "rejected") {
    console.error(
      `fromNumber lookup failed for ${record.id}:`,
      fromResult.reason,
    );
  }

  if (toResult.status === "rejected") {
    console.error(`toNumber lookup failed for ${record.id}:`, toResult.reason);
  }

  const fromInfo =
    fromResult.status === "fulfilled" ? fromResult.value : undefined;
  const toInfo = toResult.status === "fulfilled" ? toResult.value : undefined;

  const estimatedCost =
    fromInfo !== undefined
      ? (duration / 60) * fromInfo.estimatedCostPerMinute
      : undefined;

  return {
    ...record,
    duration,
    fromOperator: fromInfo?.operator,
    fromCountry: fromInfo?.country,
    toOperator: toInfo?.operator,
    toCountry: toInfo?.country,
    estimatedCost,
  };
}

export async function enrichAll(
  records: CallRecord[],
): Promise<EnrichedCallRecord[]> {
  return Promise.all(records.map(enrichRecord));
}
