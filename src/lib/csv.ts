/**
 * Minimal RFC-4180 CSV helpers for vault import/export.
 * Columns: site, url, username, password, tags, notes
 * Multiple tags are separated with ";" inside the tags column.
 */

export const CSV_HEADER = ["site", "url", "username", "password", "tags", "notes"] as const;

export interface CsvRow {
  site: string;
  url: string;
  username: string;
  password: string;
  tags: string[];
  notes: string;
}

function escapeField(v: string): string {
  if (/[",\r\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function toCsv(rows: CsvRow[]): string {
  const lines = [CSV_HEADER.join(",")];
  for (const r of rows) {
    lines.push(
      [r.site, r.url, r.username, r.password, r.tags.join(";"), r.notes]
        .map(escapeField)
        .join(",")
    );
  }
  return lines.join("\r\n") + "\r\n";
}

export function csvTemplate(): string {
  return toCsv([
    {
      site: "GitHub",
      url: "github.com",
      username: "you@example.com",
      password: "s3cret-Example!",
      tags: ["dev", "work"],
      notes: "optional free text",
    },
  ]);
}

/** Parse CSV text into fields, honoring quoted fields with commas/newlines. */
function parseFields(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.length > 1 || row[0] !== "") rows.push(row);
  return rows;
}

export interface CsvParseResult {
  rows: CsvRow[];
  errors: string[];
}

export function parseCsv(text: string): CsvParseResult {
  const raw = parseFields(text.replace(/^﻿/, ""));
  const errors: string[] = [];
  if (raw.length === 0) return { rows: [], errors: ["File is empty."] };

  const header = raw[0].map((h) => h.trim().toLowerCase());
  const idx = Object.fromEntries(CSV_HEADER.map((c) => [c, header.indexOf(c)])) as Record<
    (typeof CSV_HEADER)[number],
    number
  >;
  if (idx.site === -1 || idx.password === -1) {
    return {
      rows: [],
      errors: [`Header must include at least "site" and "password". Found: ${header.join(", ")}`],
    };
  }

  const rows: CsvRow[] = [];
  for (let i = 1; i < raw.length; i++) {
    const f = raw[i];
    const get = (k: (typeof CSV_HEADER)[number]) => (idx[k] >= 0 ? (f[idx[k]] ?? "").trim() : "");
    const site = get("site");
    if (!site) {
      errors.push(`Row ${i + 1}: missing site — skipped.`);
      continue;
    }
    rows.push({
      site,
      url: get("url"),
      username: get("username"),
      password: get("password"),
      tags: get("tags")
        .split(";")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      notes: get("notes"),
    });
  }
  return { rows, errors };
}

export function downloadFile(name: string, content: string, mime = "text/csv;charset=utf-8"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
