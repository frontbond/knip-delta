/** Fixed marker so a PR-commenting workflow (e.g. peter-evans/create-or-update-comment)
 * can find and update its own previous comment instead of piling up new ones. */
export const COMMENT_MARKER = "<!-- knip-delta:report -->";
function groupByFile(issues) {
    const groups = new Map();
    for (const issue of issues) {
        const list = groups.get(issue.file) ?? [];
        list.push(issue);
        groups.set(issue.file, list);
    }
    return groups;
}
function renderIssueList(issues) {
    const byFile = groupByFile(issues);
    const lines = [];
    for (const [file, fileIssues] of byFile) {
        lines.push(`- \`${file}\``);
        for (const issue of fileIssues) {
            const loc = typeof issue.entry.line === "number" ? `:${issue.entry.line}` : "";
            lines.push(`  - **${issue.category}** \`${issue.identity}\`${loc}`);
        }
    }
    return lines.join("\n");
}
/** Renders a Markdown report meant to be posted as a PR comment. Only the
 * "added" section is expanded by default — that's the part a reviewer
 * actually needs to act on. Resolved and pre-existing issues are collapsed
 * so the comment stays short even on a codebase with a large backlog. */
export function toMarkdown(diff) {
    const out = [COMMENT_MARKER, ""];
    if (diff.totals.added === 0) {
        out.push("### ✅ Knip: no new issues introduced");
    }
    else {
        out.push(`### ⚠️ Knip: ${diff.totals.added} new issue(s) introduced by this PR`);
        out.push("");
        out.push(renderIssueList(diff.added));
    }
    if (diff.totals.removed > 0) {
        out.push("");
        out.push(`<details><summary>✅ ${diff.totals.removed} issue(s) resolved by this PR</summary>\n`);
        out.push(renderIssueList(diff.removed));
        out.push("\n</details>");
    }
    if (diff.totals.unchanged > 0) {
        out.push("");
        out.push(`<details><summary>${diff.totals.unchanged} pre-existing issue(s), not introduced by this PR</summary>\n`);
        out.push(renderIssueList(diff.unchanged));
        out.push("\n</details>");
    }
    out.push("");
    out.push("<sub>Reported by knip-delta.</sub>");
    return out.join("\n");
}
//# sourceMappingURL=markdown.js.map