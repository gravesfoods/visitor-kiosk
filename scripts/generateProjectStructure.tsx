#!/usr/bin/env node
/**
 * scripts/generateProjectStructure.tsx
 *
 * Generates a Markdown file (PROJECT_STRUCTURE.md) with a tree view of the project.
 * - Always excludes: node_modules
 * - Includes: directories + files
 * - Targets repo root automatically (searches upward for package.json or .git)
 *
 * Run:
 *   npx tsx scripts/generateProjectStructure.tsx
 *
 * Options:
 *   --out <path>         Output markdown file (default: <repoRoot>/PROJECT_STRUCTURE.md)
 *   --maxDepth <number>  Max recursion depth (default: unlimited)
 *   --exclude <name>     Exclude folder/file name (repeatable). node_modules is always excluded.
 *   --noDotfiles         Skip dotfiles/directories (e.g. .gitignore, .env, .github)
 *   --root <path>        Override auto-detected root (optional)
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

type Options = {
  root: string;
  out: string;
  maxDepth: number | null;
  excludes: Set<string>;
  includeDotfiles: boolean;
};

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function findRepoRoot(startDir: string): Promise<string> {
  let current = path.resolve(startDir);

  while (true) {
    const pkgJson = path.join(current, "package.json");
    const gitDir = path.join(current, ".git");

    if (await pathExists(pkgJson)) return current;
    if (await pathExists(gitDir)) return current;

    const parent = path.dirname(current);
    if (parent === current) break; // reached filesystem root
    current = parent;
  }

  // Fallback: if no markers found, use where you ran it
  return path.resolve(startDir);
}

function parseArgs(argv: string[], detectedRoot: string): Options {
  const opts: Options = {
    root: detectedRoot,
    out: path.join(detectedRoot, "PROJECT_STRUCTURE.md"),
    maxDepth: null,
    excludes: new Set<string>(["node_modules"]),
    includeDotfiles: true,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];

    if (a === "--root") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --root");
      opts.root = path.resolve(v);
      // if root is overridden, keep default out aligned to it unless --out is explicitly set later
      opts.out = path.join(opts.root, "PROJECT_STRUCTURE.md");
    } else if (a === "--out") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --out");
      opts.out = path.resolve(v);
    } else if (a === "--maxDepth") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --maxDepth");
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) throw new Error("--maxDepth must be a non-negative number");
      opts.maxDepth = n;
    } else if (a === "--exclude") {
      const v = argv[++i];
      if (!v) throw new Error("Missing value for --exclude");
      opts.excludes.add(v);
    } else if (a === "--noDotfiles") {
      opts.includeDotfiles = false;
    } else if (a.startsWith("--")) {
      throw new Error(`Unknown option: ${a}`);
    }
  }

  // Always enforce node_modules exclusion
  opts.excludes.add("node_modules");

  return opts;
}

function shouldSkipName(name: string, opts: Options): boolean {
  if (!opts.includeDotfiles && name.startsWith(".")) return true;
  if (opts.excludes.has(name)) return true;
  return false;
}

async function buildTreeLines(
  dir: string,
  opts: Options,
  prefix = "",
  depth = 0
): Promise<string[]> {
  if (opts.maxDepth !== null && depth > opts.maxDepth) return [];

  let entries = await fs.readdir(dir, { withFileTypes: true });
  entries = entries.filter((e) => !shouldSkipName(e.name, opts));

  // Sort: directories first, then files; both alphabetical
  entries.sort((a, b) => {
    const ad = a.isDirectory() ? 0 : 1;
    const bd = b.isDirectory() ? 0 : 1;
    if (ad !== bd) return ad - bd;
    return a.name.localeCompare(b.name);
  });

  const lines: string[] = [];

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const isLast = i === entries.length - 1;

    const branch = isLast ? "└── " : "├── ";
    const nextPrefix = prefix + (isLast ? "    " : "│   ");

    const fullPath = path.join(dir, e.name);

    const displayName = e.isDirectory() ? `${e.name}/` : e.name;
    lines.push(prefix + branch + displayName);

    if (e.isDirectory()) {
      try {
        const childLines = await buildTreeLines(fullPath, opts, nextPrefix, depth + 1);
        lines.push(...childLines);
      } catch {
        lines.push(nextPrefix + "└── " + "[unreadable]");
      }
    }
  }

  return lines;
}

async function main() {
  const detectedRoot = await findRepoRoot(process.cwd());
  const opts = parseArgs(process.argv.slice(2), detectedRoot);

  const rootLabel = path.basename(opts.root) || opts.root;

  const treeLines = await buildTreeLines(opts.root, opts);
  const treeText = [rootLabel + "/", ...treeLines].join("\n");

  const md = [
    `# Project structure`,
    ``,
    `> Generated from: \`${opts.root}\``,
    `> Excluding: \`${Array.from(opts.excludes).sort().join("`, `")}\``,
    ``,
    "```text",
    treeText,
    "```",
    "",
  ].join("\n");

  await fs.writeFile(opts.out, md, "utf8");
  // eslint-disable-next-line no-console
  console.log(`Wrote: ${opts.out}`);
  // eslint-disable-next-line no-console
  console.log(`Root used: ${opts.root}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
