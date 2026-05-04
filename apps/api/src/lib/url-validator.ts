import { URL } from "url";
import dns from "dns/promises";
import net from "net";

const BLOCKED_PROTOCOLS = ["file:", "ftp:", "gopher:", "data:", "javascript:"];

const PRIVATE_IPV4_RANGES = [
  // Loopback
  { start: "127.0.0.0", end: "127.255.255.255" },
  // 10.0.0.0/8
  { start: "10.0.0.0", end: "10.255.255.255" },
  // 172.16.0.0/12
  { start: "172.16.0.0", end: "172.31.255.255" },
  // 192.168.0.0/16
  { start: "192.168.0.0", end: "192.168.255.255" },
  // Link-local
  { start: "169.254.0.0", end: "169.254.255.255" },
  // Current network
  { start: "0.0.0.0", end: "0.255.255.255" },
  // Shared address space (CGNAT)
  { start: "100.64.0.0", end: "100.127.255.255" },
  // IETF protocol assignments
  { start: "192.0.0.0", end: "192.0.0.255" },
  // Documentation
  { start: "192.0.2.0", end: "192.0.2.255" },
  { start: "198.51.100.0", end: "198.51.100.255" },
  { start: "203.0.113.0", end: "203.0.113.255" },
  // Benchmarking
  { start: "198.18.0.0", end: "198.19.255.255" },
  // Broadcast
  { start: "255.255.255.255", end: "255.255.255.255" },
];

function ipToLong(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isPrivateIPv4(ip: string): boolean {
  const ipLong = ipToLong(ip);
  for (const range of PRIVATE_IPV4_RANGES) {
    const startLong = ipToLong(range.start);
    const endLong = ipToLong(range.end);
    if (ipLong >= startLong && ipLong <= endLong) {
      return true;
    }
  }
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  // Loopback ::1
  if (normalized === "::1" || normalized === "0000:0000:0000:0000:0000:0000:0000:0001") {
    return true;
  }
  // Unspecified ::
  if (normalized === "::" || normalized === "0000:0000:0000:0000:0000:0000:0000:0000") {
    return true;
  }
  // Link-local fe80::/10
  if (normalized.startsWith("fe80:") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
    return true;
  }
  // Unique local fc00::/7
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }
  // IPv4-mapped IPv6 addresses ::ffff:x.x.x.x
  const v4MappedMatch = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4MappedMatch) {
    return isPrivateIPv4(v4MappedMatch[1]);
  }
  return false;
}

function isPrivateIP(ip: string): boolean {
  if (net.isIPv4(ip)) {
    return isPrivateIPv4(ip);
  }
  if (net.isIPv6(ip)) {
    return isPrivateIPv6(ip);
  }
  return false;
}

export class UrlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UrlValidationError";
  }
}

/**
 * Validates a URL against SSRF attacks by checking the protocol, hostname,
 * and resolved IP addresses against known private/internal ranges.
 *
 * @param url - The URL string to validate
 * @throws {UrlValidationError} if the URL is unsafe
 */
export async function validateUrl(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UrlValidationError("Invalid URL format");
  }

  // Block dangerous protocols
  if (BLOCKED_PROTOCOLS.includes(parsed.protocol)) {
    throw new UrlValidationError(`Blocked protocol: ${parsed.protocol}`);
  }

  // Only allow http and https
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UrlValidationError(`Unsupported protocol: ${parsed.protocol}`);
  }

  // Block URLs with credentials
  if (parsed.username || parsed.password) {
    throw new UrlValidationError("URLs with embedded credentials are not allowed");
  }

  const hostname = parsed.hostname;

  // If the hostname is already an IP address, check it directly
  if (net.isIP(hostname)) {
    if (isPrivateIP(hostname)) {
      throw new UrlValidationError("URL resolves to a private/internal IP address");
    }
    return;
  }

  // Block common internal hostnames
  const lowerHostname = hostname.toLowerCase();
  const blockedHostnames = [
    "localhost",
    "metadata.google.internal",
    "metadata.google",
    "169.254.169.254",
  ];
  if (blockedHostnames.includes(lowerHostname)) {
    throw new UrlValidationError(`Blocked hostname: ${hostname}`);
  }

  // Resolve DNS and check all returned IPs
  try {
    const addresses = await dns.resolve(hostname);
    for (const addr of addresses) {
      if (isPrivateIP(addr)) {
        throw new UrlValidationError(
          `Hostname "${hostname}" resolves to private IP address`
        );
      }
    }
  } catch (err) {
    if (err instanceof UrlValidationError) {
      throw err;
    }
    throw new UrlValidationError(`DNS resolution failed for hostname: ${hostname}`);
  }

  // Also check AAAA records
  try {
    const addresses = await dns.resolve6(hostname);
    for (const addr of addresses) {
      if (isPrivateIP(addr)) {
        throw new UrlValidationError(
          `Hostname "${hostname}" resolves to private IPv6 address`
        );
      }
    }
  } catch (err) {
    if (err instanceof UrlValidationError) {
      throw err;
    }
    // AAAA records may not exist; that is fine
  }
}
