# knip-delta

Diff two [Knip](https://knip.dev) JSON reports and show only the issues a
change **introduced** or **resolved** — not the entire existing backlog.

## The problem

[Knip](https://knip.dev) finds unused files, exports, and dependencies in
JS/TS projects, and it's genuinely good at it. But on any codebase that
hasn't run Knip from day one, turning it on in CI means every PR — including
one-line fixes — gets confronted with hundreds of pre-existing findings that
have nothing to do with the change. That's enough friction that teams either
never turn Knip on in CI, or turn it on and ignore it.

The existing [Knip Reporter](https://github.com/marketplace/actions/knip-reporter)
GitHub Action posts Knip's full report as a PR comment — every run, the
complete list, no comparison against what already existed before the PR.
knip-delta does the other half of the job: it diffs a **base** report
against a **head** report and tells you what's actually new.

```
### ⚠️ Knip: 2 new issue(s) introduced by this PR

- `src/lib/pricing.ts`
  - **exports** `calculateLegacyDiscount`:42
  - **types** `UnusedPricingTier`:12

<details><summary>438 pre-existing issue(s), not introduced by this PR</summary>
...
</details>
```

## What it is

- A small CLI (`knip-delta diff --base base.json --head head.json`) that
  does the comparison and prints JSON, Markdown, or plain text.
- A GitHub Action (`action.yml`) that wraps the CLI for CI use.
- Not a fork or replacement of Knip. It only ever consumes
  `knip --reporter json` output — it has no opinion about how you configure
  Knip itself.

## Install

```bash
npm install --save-dev knip-delta
```

Or use it without installing, via `npx knip-delta`.

## CLI usage

```bash
# 1. Generate a report for your target branch
git checkout main
npx knip --reporter json > base.json

# 2. Generate a report for your PR branch
git checkout my-feature-branch
npx knip --reporter json > head.json

# 3. Diff them
npx knip-delta diff --base base.json --head head.json --format markdown
```

Options:

| Flag | Description | Default |
| --- | --- | --- |
| `--base <path>` | Knip JSON report for the base ref | required |
| `--head <path>` | Knip JSON report for the head ref | required |
| `--format <fmt>` | `text`, `markdown`, or `json` | `text` |
| `--out <path>` | Write to a file instead of stdout | stdout |
| `--fail-on <mode>` | `added` (exit 1 if new issues exist) or `never` | `added` |

## GitHub Actions usage

Full example: [`.github/workflows/example-pr-check.yml`](.github/workflows/example-pr-check.yml).
The gist — run Knip against both the base and head commit of the PR, then
hand both JSON files to the action:

```yaml
- uses: YOUR_GITHUB_USERNAME/knip-delta@v0
  id: knip-delta
  with:
    base-report: ${{ runner.temp }}/base.json
    head-report: ${{ runner.temp }}/head.json

- uses: peter-evans/create-or-update-comment@v4
  with:
    issue-number: ${{ github.event.pull_request.number }}
    comment-tag: knip-delta
    edit-mode: replace
    body-path: ${{ steps.knip-delta.outputs.markdown-path }}
```

The action fails the step when new issues were introduced (`fail-on:
added`, the default) and always produces `markdown-path` / `json-path`
outputs, so you can post a comment even when the step fails (`if: always()`
on the comment step, as in the example workflow).

### Why two checkouts?

knip-delta only diffs two already-generated reports; it deliberately has no
opinion about how you produce them. The example workflow's "checkout base,
`npm ci`, run knip; checkout head, `npm ci`, run knip" is the same pattern
used by tools like `size-limit` and `bundlewatch` — it's slower than a single
checkout, but it means installed dependencies match the code actually being
analyzed on each side, even if a PR changes `package.json` itself.

## Programmatic use

```ts
import { computeDiff, toMarkdown } from "knip-delta";

const diff = computeDiff(baseReport, headReport);
console.log(diff.totals); // { added: 2, removed: 0, unchanged: 438 }
console.log(toMarkdown(diff));
```

## How issues are matched

An issue is identified by `(file path, category, name)` — deliberately
*excluding* line/column/position. Those shift whenever unrelated code above
an issue changes, which would otherwise make an untouched issue look "new"
just because the base and head checkouts diverge elsewhere in the file.

One consequence: if a PR renames a file or moves an export to a new file,
knip-delta reports it as one resolved issue + one new issue, rather than
recognizing it as a move. Good enough for the common case; a smarter
same-file-content heuristic is a reasonable future improvement.

## Development

```bash
npm ci
npm run build   # tsc -> dist/
npm test        # vitest, against real `knip --reporter json` fixtures
```

`dist/` is committed (not gitignored) because this repo is consumed directly
as a GitHub Action via `uses: owner/knip-delta@version` — there's no build
step at consumption time. CI fails if `dist/` drifts from `src/`.

## License

MIT
