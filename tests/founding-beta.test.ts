import { describe, expect, test } from "bun:test";
import {
  FOUNDING_BETA_EXISTING_USER_CUTOFF,
  FOUNDING_BETA_PERMANENT_EXPIRY,
  claimFoundingBetaReservationWithDb,
  isExistingFoundingBetaEligible,
  normalizeFoundingBetaEmail,
} from "../src/lib/founding-beta";

describe("Founding Beta entitlement policy", () => {
  test("existing eligible users qualify at or before the cohort cutoff", () => {
    expect(isExistingFoundingBetaEligible({
      email: "real.user@example.com",
      createdAt: FOUNDING_BETA_EXISTING_USER_CUTOFF,
    })).toBe(true);
  });

  test("excluded owner/test/service accounts do not qualify via the existing-user cohort", () => {
    expect(isExistingFoundingBetaEligible({
      email: " Tahlia.Ashwood@gmail.com ",
      createdAt: "2026-08-20T00:00:00Z",
    })).toBe(false);
  });

  test("ordinary new users after the cutoff are not silently enrolled", () => {
    expect(isExistingFoundingBetaEligible({
      email: "new.user@example.com",
      createdAt: "2026-09-02T00:00:00Z",
    })).toBe(false);
  });

  test("reserved future users claim permanent access atomically without deleting reservation history", async () => {
    const calls: Array<{ sql: string; params?: unknown[] }> = [];
    const db = {
      query: async (sql: string, params?: unknown[]) => {
        calls.push({ sql, params });
        return [{ claimed: true }];
      },
    };

    const claimed = await claimFoundingBetaReservationWithDb(db, {
      id: "user-123",
      email: " Future.User@Example.com ",
      tier: "free",
    });

    expect(claimed).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain("UPDATE founding_beta_reservations");
    expect(calls[0].sql).toContain("claimed_at = NOW()");
    expect(calls[0].sql).toContain("INSERT INTO founding_beta_access");
    expect(calls[0].sql).toContain("UPDATE users");
    expect(calls[0].sql).not.toContain("DELETE FROM founding_beta_reservations");
    expect(calls[0].params).toEqual([
      normalizeFoundingBetaEmail(" Future.User@Example.com "),
      "user-123",
      "free",
      FOUNDING_BETA_PERMANENT_EXPIRY,
    ]);
  });

  test("users without an active reservation are not granted Founding Beta", async () => {
    const db = {
      query: async () => [{ claimed: false }],
    };

    expect(await claimFoundingBetaReservationWithDb(db, {
      id: "user-ordinary",
      email: "ordinary@example.com",
      tier: "free",
    })).toBe(false);
  });
});
