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
export {};
//# sourceMappingURL=types.js.map