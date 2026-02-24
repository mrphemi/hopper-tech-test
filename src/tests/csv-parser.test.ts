import { describe, it, expect } from "vitest";
import { parseCSV } from "../csv-parser";

const VALID_HEADER =
  "id,callStartTime,callEndTime,fromNumber,toNumber,callType,region";
const VALID_ROW =
  "cdr_001,2026-01-21T14:30:00.000Z,2026-01-21T14:35:30.000Z,+14155551234,+442071234567,voice,us-west";

describe("parseCSV", () => {
  describe("happy path", () => {
    it("parses a valid CSV into CallRecords", () => {
      const { records, errors } = parseCSV(`${VALID_HEADER}\n${VALID_ROW}`);

      expect(errors).toHaveLength(0);
      expect(records).toHaveLength(1);
      expect(records[0]).toEqual({
        id: "cdr_001",
        callStartTime: "2026-01-21T14:30:00.000Z",
        callEndTime: "2026-01-21T14:35:30.000Z",
        fromNumber: "+14155551234",
        toNumber: "+442071234567",
        callType: "voice",
        region: "us-west",
      });
    });

    it("parses multiple rows", () => {
      const row2 =
        "cdr_002,2026-01-21T14:31:15.000Z,2026-01-21T14:33:45.000Z,+442071234567,+14155551234,voice,eu-west";
      const { records, errors } = parseCSV(
        `${VALID_HEADER}\n${VALID_ROW}\n${row2}`,
      );

      expect(errors).toHaveLength(0);
      expect(records).toHaveLength(2);
    });
  });

  describe("empty / whitespace payloads", () => {
    it("returns empty result for empty string", () => {
      const { records, errors } = parseCSV("");
      expect(records).toHaveLength(0);
      expect(errors).toHaveLength(0);
    });

    it("returns empty result for whitespace-only string", () => {
      const { records, errors } = parseCSV("   \n  ");
      expect(records).toHaveLength(0);
      expect(errors).toHaveLength(0);
    });

    it("returns empty result for header-only CSV", () => {
      const { records, errors } = parseCSV(VALID_HEADER);
      expect(records).toHaveLength(0);
      expect(errors).toHaveLength(0);
    });
  });

  describe("invalid headers", () => {
    it("returns an error and no records when headers are wrong", () => {
      const { records, errors } = parseCSV(`wrong,headers\n${VALID_ROW}`);
      expect(records).toHaveLength(0);
      expect(errors).toHaveLength(1);
      expect(errors[0].row).toBe(1);
    });
  });

  describe("invalid rows", () => {
    it("skips a row with wrong column count and records an error", () => {
      const badRow = "cdr_002,2026-01-21T14:30:00.000Z";
      const { records, errors } = parseCSV(
        `${VALID_HEADER}\n${VALID_ROW}\n${badRow}`,
      );

      expect(records).toHaveLength(1);
      expect(errors).toHaveLength(1);
      expect(errors[0].row).toBe(3);
    });

    it("rejects a row with an invalid callStartTime", () => {
      const row =
        "cdr_001,not-a-date,2026-01-21T14:35:30.000Z,+14155551234,+442071234567,voice,us-west";
      const { records, errors } = parseCSV(`${VALID_HEADER}\n${row}`);

      expect(records).toHaveLength(0);
      expect(errors[0].message).toMatch(/callStartTime/);
    });

    it("rejects a row where callEndTime is before callStartTime", () => {
      const row =
        "cdr_001,2026-01-21T14:35:30.000Z,2026-01-21T14:30:00.000Z,+14155551234,+442071234567,voice,us-west";
      const { records, errors } = parseCSV(`${VALID_HEADER}\n${row}`);

      expect(records).toHaveLength(0);
      expect(errors[0].message).toMatch(/before/);
    });

    it("rejects a row with an invalid E.164 fromNumber", () => {
      const row =
        "cdr_001,2026-01-21T14:30:00.000Z,2026-01-21T14:35:30.000Z,0123456789,+442071234567,voice,us-west";
      const { records, errors } = parseCSV(`${VALID_HEADER}\n${row}`);

      expect(records).toHaveLength(0);
      expect(errors[0].message).toMatch(/fromNumber/);
    });

    it("rejects a row with an invalid callType", () => {
      const row =
        "cdr_001,2026-01-21T14:30:00.000Z,2026-01-21T14:35:30.000Z,+14155551234,+442071234567,fax,us-west";
      const { records, errors } = parseCSV(`${VALID_HEADER}\n${row}`);

      expect(records).toHaveLength(0);
      expect(errors[0].message).toMatch(/callType/);
    });

    it("returns valid rows alongside errors for invalid rows", () => {
      const badRow =
        "cdr_002,not-a-date,2026-01-21T14:35:30.000Z,+14155551234,+442071234567,voice,us-west";
      const { records, errors } = parseCSV(
        `${VALID_HEADER}\n${VALID_ROW}\n${badRow}`,
      );

      expect(records).toHaveLength(1);
      expect(errors).toHaveLength(1);
    });
  });
});
