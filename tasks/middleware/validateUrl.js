const dns = require("dns").promises;
const net = require("net");

const BLOCKED_CIDRS = [
    // IPv4 loopback
    { start: ip4ToLong("127.0.0.0"), end: ip4ToLong("127.255.255.255") },
    // RFC1918 private
    { start: ip4ToLong("10.0.0.0"), end: ip4ToLong("10.255.255.255") },
    { start: ip4ToLong("172.16.0.0"), end: ip4ToLong("172.31.255.255") },
    { start: ip4ToLong("192.168.0.0"), end: ip4ToLong("192.168.255.255") },
    // link-local
    { start: ip4ToLong("169.254.0.0"), end: ip4ToLong("169.254.255.255") },
];

function ip4ToLong(ip) {
    return ip.split(".").reduce((acc, octet) => acc * 256 + parseInt(octet, 10), 0);
}

function isBlockedIPv4(ip) {
    const long = ip4ToLong(ip);
    return BLOCKED_CIDRS.some((r) => long >= r.start && long <= r.end);
}

function isBlockedIPv6(ip) {
    const normalized = ip.toLowerCase().replace(/^::ffff:/, "");
    return (
        normalized === "::1" ||
        normalized.startsWith("fc") ||
        normalized.startsWith("fd") ||
        normalized.startsWith("fe80")
    );
}

async function validateUrl(urlString) {
    let parsed;
    try {
        parsed = new URL(urlString);
    } catch {
        throw new Error("Invalid URL");
    }

    if (parsed.protocol !== "https:") {
        throw new Error("Only HTTPS URLs are allowed");
    }

    const hostname = parsed.hostname;
    // URL parser keeps brackets around IPv6 literals (e.g. "[::1]") — strip them
    const host = hostname.startsWith("[") && hostname.endsWith("]")
        ? hostname.slice(1, -1)
        : hostname;

    if (net.isIPv4(host)) {
        if (isBlockedIPv4(host)) throw new Error("URL resolves to a blocked address");
        return;
    }

    if (net.isIPv6(host)) {
        if (isBlockedIPv6(host)) throw new Error("URL resolves to a blocked address");
        return;
    }

    // DNS resolution — validate the resolved IP, not just the hostname string
    let addresses;
    try {
        addresses = await dns.resolve(host);
    } catch {
        throw new Error("Could not resolve hostname");
    }

    for (const addr of addresses) {
        if (net.isIPv4(addr) && isBlockedIPv4(addr)) {
            throw new Error("URL resolves to a blocked address");
        }
        if (net.isIPv6(addr) && isBlockedIPv6(addr)) {
            throw new Error("URL resolves to a blocked address");
        }
    }
}

module.exports = { validateUrl };
