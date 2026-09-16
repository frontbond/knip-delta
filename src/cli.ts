#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { Command } from "commander";
import { computeDiff } from "./diff.js";
import { toMarkdown } from "./format/markdown.js";
import { toText } from "./format/text.js";
import type { DiffResult, KnipReport } from "./types.js";

function readReport(path: string): KnipReport {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (error) {
    throw new Error(
      `Could not read Knip report at "${path}": ${(error as Error).message}`,
    );
  }
  try {
    return JSON.parse(raw) as KnipReport;
  } catch {
    throw new Error(
      `"${path}" is not valid JSON. Generate it with: knip --reporter json > ${path}`,
    );
  }
}

function formatOutput(diff: DiffResult, format: string): string {
  switch (format) {
    case "json":
      return JSON.stringify(diff, null, 2);
    case "markdown":
      return toMarkdown(diff);
    case "text":
      return toText(diff);
    default:
      throw new Error(
        `Unknown --format "${format}". Expected one of: json, markdown, text.`,
      );
  }
}

const program = new Command();

program
  .name("knip-delta")
  .description(
    "Diff two `knip --reporter json` reports and show only what a change introduced or fixed.",
  )
  .version("0.1.0");

program
  .command("diff")
  .description("Compare a base and head Knip JSON report")
  .requiredOption(
    "--base <path>",
    "Path to the Knip JSON report for the base/target branch",
  )
  .requiredOption(
    "--head <path>",
    "Path to the Knip JSON report for the head/PR branch",
  )
  .option("--format <format>", "json | markdown | text", "text")
  .option("--out <path>", "Write the report to a file instead of stdout")
  .option(
    "--fail-on <mode>",
    "When to exit non-zero: 'added' (default) or 'never'",
    "added",
  )
  .action((opts) => {
    const base = readReport(opts.base);
    const head = readReport(opts.head);
    const diff = computeDiff(base, head);
    const output = formatOutput(diff, opts.format);

    if (opts.out) {
      writeFileSync(opts.out, output);
    } else {
      console.log(output);
    }

    if (opts.failOn === "added" && diff.totals.added > 0) {
      process.exitCode = 1;
    } else if (opts.failOn !== "added" && opts.failOn !== "never") {
      throw new Error(`Unknown --fail-on "${opts.failOn}". Expected: added, never.`);
    }
  });

program.parseAsync(process.argv).catch((error: Error) => {
  console.error(`knip-delta: ${error.message}`);
  process.exitCode = 1;
});
