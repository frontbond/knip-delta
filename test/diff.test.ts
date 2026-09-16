import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { computeDiff, flattenReport } from "../src/diff.js";
import { toMarkdown, COMMENT_MARKER } from "../src/format/markdown.js";
import { toText } from "../src/format/text.js";
import type { KnipReport } from "../src/types.js";

const dir = path.dirname(fileURLToPath(import.meta.url));

function fixture(name: string): KnipReport {
  return JSON.parse(readFileSync(path.join(dir, "fixtures", name), "utf8"));
}

// These fixtures are real `knip --reporter json` output, captured from a
// minimal reproduction project, not hand-written guesses about the schema:
// base.json  = a project with one unused file (src/orphan.ts)
// head.json  = the same project, plus src/lib.ts with 2 unused exports and
//              2 unused type declarations
const base = fixture("base.json");
const head = fixture("head.json");

describe("computeDiff (real Knip fixtures)", () => {
  it("treats the pre-existing orphan file as unchanged, not added", () => {
    const diff = computeDiff(base, head);
    expect(diff.added.some((i) => i.file === "src/orphan.ts")).toBe(false);
    expect(diff.unchanged.some((i) => i.file === "src/orphan.ts")).toBe(true);
  });

  it("reports the new lib.ts exports and types as added", () => {
    const diff = computeDiff(base, head);
    const addedNames = diff.added.map((i) => i.identity).sort();
    expect(addedNames).toEqual(["Status", "UnusedType", "unused", "unusedConst"]);
    expect(diff.totals.added).toBe(4);
  });

  it("reports nothing as removed when head is a superset of base", () => {
    const diff = computeDiff(base, head);
    expect(diff.totals.removed).toBe(0);
  });

  it("is symmetric: diffing head -> base reports the same issues as removed", () => {
    const diff = computeDiff(head, base);
    expect(diff.totals.added).toBe(0);
    expect(diff.totals.removed).toBe(4);
  });

  it("produces a per-category summary", () => {
    const diff = computeDiff(base, head);
    const exportsSummary = diff.summary.find((s) => s.category === "exports");
    const typesSummary = diff.summary.find((s) => s.category === "types");
    expect(exportsSummary).toEqual({ category: "exports", added: 2, removed: 0, unchanged: 0 });
    expect(typesSummary).toEqual({ category: "types", added: 2, removed: 0, unchanged: 0 });
  });
});

describe("computeDiff (edge cases)", () => {
  it("returns no issues when both reports are identical", () => {
    const diff = computeDiff(base, base);
    expect(diff.totals).toEqual({ added: 0, removed: 0, unchanged: 1 });
  });

  it("handles empty reports", () => {
    const empty: KnipReport = { issues: [] };
    const diff = computeDiff(empty, empty);
    expect(diff.totals).toEqual({ added: 0, removed: 0, unchanged: 0 });
  });

  it("does not let unrelated line-number shifts create false positives", () => {
    // Same issue, but its line/col/pos moved because unrelated code above
    // it changed between base and head checkouts.
    const shiftedHead: KnipReport = {
      issues: [
        {
          file: "src/lib.ts",
          exports: [{ name: "unused", line: 40, col: 1, pos: 900 }],
        },
      ],
    };
    const shiftedBase: KnipReport = {
      issues: [
        {
          file: "src/lib.ts",
          exports: [{ name: "unused", line: 2, col: 17, pos: 53 }],
        },
      ],
    };
    const diff = computeDiff(shiftedBase, shiftedHead);
    expect(diff.totals).toEqual({ added: 0, removed: 0, unchanged: 1 });
  });

  it("flattenReport ignores non-array, non-issue fields on a group", () => {
    const report: KnipReport = {
      issues: [{ file: "src/a.ts", exports: [{ name: "x" }] }],
    };
    const flat = flattenReport(report);
    expect(flat).toHaveLength(1);
    expect(flat[0]).toMatchObject({ file: "src/a.ts", category: "exports", identity: "x" });
  });
});

describe("formatters", () => {
  it("toText summarizes a clean diff", () => {
    const diff = computeDiff(base, base);
    expect(toText(diff)).toContain("No new Knip issues introduced");
  });

  it("toText flags new issues", () => {
    const diff = computeDiff(base, head);
    const text = toText(diff);
    expect(text).toContain("4 new Knip issue(s) introduced");
    expect(text).toContain("src/lib.ts");
  });

  it("toMarkdown includes the comment marker for idempotent PR comments", () => {
    const diff = computeDiff(base, head);
    expect(toMarkdown(diff)).toContain(COMMENT_MARKER);
  });

  it("toMarkdown renders a green summary when nothing new was introduced", () => {
    const diff = computeDiff(base, base);
    expect(toMarkdown(diff)).toContain("no new issues introduced");
  });
});
