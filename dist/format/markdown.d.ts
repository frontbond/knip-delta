import type { DiffResult } from "../types.js";
/** Fixed marker so a PR-commenting workflow (e.g. peter-evans/create-or-update-comment)
 * can find and update its own previous comment instead of piling up new ones. */
export declare const COMMENT_MARKER = "<!-- knip-delta:report -->";
/** Renders a Markdown report meant to be posted as a PR comment. Only the
 * "added" section is expanded by default — that's the part a reviewer
 * actually needs to act on. Resolved and pre-existing issues are collapsed
 * so the comment stays short even on a codebase with a large backlog. */
export declare function toMarkdown(diff: DiffResult): string;
