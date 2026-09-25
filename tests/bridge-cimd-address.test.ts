import { describe, expect, test } from "bun:test";
import { pinnedMetadataLookup, publicMetadataAddress } from "../src/lib/bridge";

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

describe("Bridge client metadata pinned lookup", () => {
  const addresses = [
    { address: "2607:6bc0::10", family: 6 },
    { address: "160.79.104.10", family: 4 },
  ];

  test("returns every vetted address when the socket asks for all", () => {
    let result: unknown[] = [];
    pinnedMetadataLookup(addresses)("claude.ai", { all: true }, (...args) => { result = args; });
    expect(result).toEqual([null, addresses]);
  });

  test("returns the first vetted address for single lookups", () => {
    let result: unknown[] = [];
    pinnedMetadataLookup(addresses)("claude.ai", {}, (...args) => { result = args; });
    expect(result).toEqual([null, "2607:6bc0::10", 6]);
  });

  test("lets an HTTPS request connect through the pinned lookup", async () => {
    const { createServer } = await import("node:net");
    const { request } = await import("node:https");
    const server = createServer((socket) => socket.destroy());
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as { port: number };
    const error = await new Promise<NodeJS.ErrnoException>((resolve) => {
      const req = request(`https://metadata.test:${port}/client`, {
        lookup: pinnedMetadataLookup([{ address: "127.0.0.1", family: 4 }]) as never,
      });
      req.on("error", resolve);
      req.end();
    });
    server.close();
    // Reaching the server (then being hung up on) proves the lookup result was accepted.
    expect(error.code).not.toBe("ERR_INVALID_IP_ADDRESS");
  });
});
