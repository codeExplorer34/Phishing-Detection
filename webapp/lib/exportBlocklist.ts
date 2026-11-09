import type { Entry } from "./protectionStore";

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/** Hosts-file text. IP addresses can't be blocked this way, so they are listed as comments. */
export function toHostsFile(entries: readonly Entry[], date: Date = new Date()): string {
  const lines = [
    "# Exported from Fishy",
    `# ${date.toISOString().slice(0, 10)}`,
    "# Copy these lines into your hosts file.",
    "",
  ];
  const hosts = [...new Set(entries.map((e) => e.host))];
  for (const host of hosts) {
    lines.push(IPV4.test(host) || host.includes(":") ? `# ${host} (an IP address, can't be blocked here)` : `0.0.0.0 ${host}`);
  }
  return `${lines.join("\n")}\n`;
}

function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;   // stop spreadsheet formula injection
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(entries: readonly Entry[]): string {
  const header = ["host", "url", "risk", "verdict", "type", "found_in", "date"];
  const rows = entries.map((e) =>
    [e.host, e.url, e.risk, e.verdict, e.threatType, e.source, new Date(e.at).toISOString()].map(csvCell).join(","),
  );
  return `${[header.join(","), ...rows].join("\n")}\n`;
}
