import { describe, expect, test } from "bun:test";
import { parseReservationEmailChange } from "../src/routes/-ownerCohort";

describe("Founding Beta reservation email change", () => {
  test("normalizes both addresses", () => {
    expect(parseReservationEmailChange({ fromEmail: " Old@Example.com ", toEmail: "New.Person@Gmail.com" }))
      .toEqual({ fromEmail: "old@example.com", toEmail: "new.person@gmail.com" });
  });

  test("rejects an invalid or missing new address", () => {
    expect(() => parseReservationEmailChange({ fromEmail: "old@example.com", toEmail: "not-an-email" })).toThrow("valid new email");
    expect(() => parseReservationEmailChange({ fromEmail: "old@example.com" })).toThrow("valid new email");
  });

  test("rejects moving a reservation to the same address", () => {
    expect(() => parseReservationEmailChange({ fromEmail: "same@example.com", toEmail: "SAME@example.com" })).toThrow("same as the current");
  });

  test("rejects a malformed current address", () => {
    expect(() => parseReservationEmailChange({ fromEmail: "", toEmail: "new@example.com" })).toThrow("current reservation email");
  });
});
