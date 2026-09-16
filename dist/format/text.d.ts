import type { DiffResult } from "../types.js";
/** Plain-text rendering, suitable for CI logs and terminal output. */
export declare function toText(diff: DiffResult): string;
