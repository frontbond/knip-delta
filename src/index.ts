export { computeDiff, flattenReport } from "./diff.js";
export { toMarkdown, COMMENT_MARKER } from "./format/markdown.js";
export { toText } from "./format/text.js";
export type {
  KnipReport,
  KnipIssueGroup,
  KnipIssueEntry,
  FlatIssue,
  DiffIssue,
  DiffResult,
  DiffStatus,
  CategorySummary,
} from "./types.js";
