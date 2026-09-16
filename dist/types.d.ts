/**
 * Shapes for Knip's `--reporter json` output.
 *
 * Knip groups issues per file. Each group has a `file` path plus one array
 * per issue category (exports, types, dependencies, files, ...). Categories
 * are NOT hardcoded here beyond `file`, because Knip has added new
 * categories over time (namespaceMembers, catalog, catalogReferences, ...)
 * and we want new ones to flow through the diff automatically instead of
 * silently being ignored.
 */
/** A single reported item inside a category array. Shape varies by
 * category: most carry `name` (+ `line`/`col`/`pos`), some (e.g. some
 * `files` entries) carry only `name`. We only rely on fields that are
 * present across categories. */
export interface KnipIssueEntry {
    name?: string;
    line?: number;
    col?: number;
    pos?: number;
    [key: string]: unknown;
}
/** One per-file group from Knip's JSON report. */
export interface KnipIssueGroup {
    file: string;
    [category: string]: KnipIssueEntry[] | string;
}
/** Top-level shape of `knip --reporter json` output. */
export interface KnipReport {
    issues: KnipIssueGroup[];
    [key: string]: unknown;
}
/** One concrete issue, flattened out of a KnipReport for diffing. */
export interface FlatIssue {
    file: string;
    category: string;
    /** Best-effort human identity for the issue within file+category. */
    identity: string;
    entry: KnipIssueEntry;
}
export type DiffStatus = "added" | "removed" | "unchanged";
export interface DiffIssue extends FlatIssue {
    status: DiffStatus;
}
export interface CategorySummary {
    category: string;
    added: number;
    removed: number;
    unchanged: number;
}
export interface DiffResult {
    /** Issues present in head but not in base — introduced by this change. */
    added: FlatIssue[];
    /** Issues present in base but not in head — resolved by this change. */
    removed: FlatIssue[];
    /** Issues present in both — pre-existing and untouched. */
    unchanged: FlatIssue[];
    /** Per-category rollup, sorted by category name. */
    summary: CategorySummary[];
    totals: {
        added: number;
        removed: number;
        unchanged: number;
    };
}
