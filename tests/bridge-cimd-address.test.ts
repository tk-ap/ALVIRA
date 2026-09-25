import { describe, expect, test } from "bun:test";
import { publicMetadataAddress } from "../src/lib/bridge";

describe("Bridge client metadata address guard", () => {
  test("allows public IPv4 and IPv6 hosts", () => {
    expect(publicMetadataAddress("160.79.104.10", 4)).toBe(true);
    expect(publicMetadataAddress("8.8.8.8", 4)).toBe(true);
    expect(publicMetadataAddress("2607:6bc0::10", 6)).toBe(true);
  });

  test("blocks private, loopback, and link-local hosts", () => {
    for (const address of ["10.1.2.3", "127.0.0.1", "169.254.169.254", "192.168.1.1", "172.16.0.1"]) {
      expect(publicMetadataAddress(address, 4)).toBe(false);
    }
    for (const address of ["::1", "::", "fd00::1", "fe80::1"]) {
      expect(publicMetadataAddress(address, 6)).toBe(false);
    }
  });

  test("blocks IPv4-mapped IPv6 forms of private hosts", () => {
    for (const address of ["::ffff:10.1.2.3", "::ffff:127.0.0.1", "::ffff:169.254.169.254", "::ffff:a01:203"]) {
      expect(publicMetadataAddress(address, 6)).toBe(false);
    }
  });
});
