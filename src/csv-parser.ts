import dayjs from "dayjs";
import { CallRecord } from "./call-record.i";

export interface ParseError {
  row: number;
  message: string;
}

export interface ParseResult {
  records: CallRecord[];
  errors: ParseError[];
}

const EXPECTED_HEADERS = [
  "id",
  "callStartTime",
  "callEndTime",
  "fromNumber",
  "toNumber",
  "callType",
  "region",
] as const;

// Valid Mobile format
const E164_REGEX = /^\+[1-9]\d{6,14}$/;

function isValidIso(value: string): boolean {
  return dayjs(value).isValid();
}

export function parseCSV(payload: string): ParseResult {
  const records: CallRecord[] = [];
  const errors: ParseError[] = [];

  if (!payload?.trim()) {
    return { records, errors };
  }

  const lines = payload.split(/\r?\n/).filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { records, errors };
  }

  const headers = lines[0].split(",");

  if (
    headers.length !== EXPECTED_HEADERS.length ||
    headers.some((h: string, i: number) => h !== EXPECTED_HEADERS[i])
  ) {
    errors.push({
      row: 1,
      message: `Invalid headers: expected [${EXPECTED_HEADERS.join(", ")}], got [${headers.join(", ")}]`,
    });
    return { records, errors };
  }

  // headers only no body
  if (lines.length === 1) {
    return { records, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1; // human-readable (header = row 1)
    const tokens = lines[i].split(",");

    if (tokens.length !== EXPECTED_HEADERS.length) {
      errors.push({
        row: rowNum,
        message: `Expected ${EXPECTED_HEADERS.length} columns, got ${tokens.length}`,
      });
      continue;
    }

    const [
      id,
      callStartTime,
      callEndTime,
      fromNumber,
      toNumber,
      callType,
      region,
    ] = tokens;

    const rowErrors: string[] = [];

    if (!id.trim()) {
      rowErrors.push("id is empty");
    }

    const startValid = isValidIso(callStartTime);
    const endValid = isValidIso(callEndTime);

    if (!startValid) {
      rowErrors.push(`callStartTime "${callStartTime}" is not valid ISO 8601`);
    }

    if (!endValid) {
      rowErrors.push(`callEndTime "${callEndTime}" is not valid ISO 8601`);
    } else if (
      startValid &&
      dayjs(callEndTime).isBefore(dayjs(callStartTime))
    ) {
      rowErrors.push("callEndTime is before callStartTime");
    }

    if (!E164_REGEX.test(fromNumber)) {
      rowErrors.push(`fromNumber "${fromNumber}" is not E.164`);
    }

    if (!E164_REGEX.test(toNumber)) {
      rowErrors.push(`toNumber "${toNumber}" is not E.164`);
    }

    if (callType !== "voice" && callType !== "video") {
      rowErrors.push(`callType "${callType}" must be "voice" or "video"`);
    }

    if (!region.trim()) {
      rowErrors.push("region is empty");
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNum, message: rowErrors.join("; ") });
      continue;
    }

    records.push({
      id: id.trim(),
      callStartTime,
      callEndTime,
      fromNumber,
      toNumber,
      callType: callType as "voice" | "video",
      region: region.trim(),
    });
  }

  return { records, errors };
}
