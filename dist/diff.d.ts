import type { DiffResult, FlatIssue, KnipReport } from "./types.js";
/** Flattens a Knip JSON report into one record per (file, category, entry).
 * Line/column/position are intentionally excluded from the diff key: they
 * shift whenever unrelated code above an issue changes, which would
 * otherwise make an untouched issue look "new" just because a base and head
 * checkout diverge elsewhere in the file. */
export declare function flattenReport(report: KnipReport): FlatIssue[];
/**
 * Compares a "base" Knip report (e.g. the PR's target branch) against a
 * "head" Knip report (e.g. the PR's branch) and classifies every issue as
 * added, removed, or unchanged.
 *
 * This is the whole point of knip-delta: Knip itself always reports every
 * issue currently in the project. On a codebase with a backlog of existing
 * findings, that makes CI noisy and PR authors get blamed for debt they
 * didn't create. Diffing two reports isolates what a specific change
 * actually introduced or fixed.
 */
export declare function computeDiff(base: KnipReport, head: KnipReport): DiffResult;
