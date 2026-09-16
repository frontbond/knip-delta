import type { DiffResult, FlatIssue } from "../types.js";

function line(issue: FlatIssue): string {
  const loc =
    typeof issue.entry.line === "number" ? `:${issue.entry.line}` : "";
  return `  ${issue.file}${loc}  [${issue.category}]  ${issue.identity}`;
}

/** Plain-text rendering, suitable for CI logs and terminal output. */
export function toText(diff: DiffResult): string {
  const out: string[] = [];

  if (diff.totals.added === 0) {
    out.push(
      `No new Knip issues introduced. (${diff.totals.unchanged} pre-existing issue(s) untouched, ${diff.totals.removed} resolved.)`,
    );
  } else {
    out.push(`${diff.totals.added} new Knip issue(s) introduced:`);
    out.push(...diff.added.map(line));
  }

  if (diff.totals.removed > 0) {
    out.push("");
    out.push(`${diff.totals.removed} issue(s) resolved:`);
    out.push(...diff.removed.map(line));
  }

  if (diff.totals.unchanged > 0) {
    out.push("");
    out.push(
      `${diff.totals.unchanged} pre-existing issue(s) untouched by this change.`,
    );
  }

  return out.join("\n");
}
