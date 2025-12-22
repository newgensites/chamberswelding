#!/usr/bin/env node
// Test: validate local href links in HTML files resolve to existing files.

const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();
const htmlFiles = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      htmlFiles.push(fullPath);
    }
  }
}

walk(rootDir);

const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
const errors = [];

for (const filePath of htmlFiles) {
  const contents = fs.readFileSync(filePath, "utf8");
  const dir = path.dirname(filePath);
  let match;

  while ((match = hrefRegex.exec(contents)) !== null) {
    const rawHref = match[1].trim();

    if (
      rawHref === "" ||
      rawHref.startsWith("#") ||
      rawHref.startsWith("mailto:") ||
      rawHref.startsWith("tel:") ||
      /^https?:\/\//i.test(rawHref) ||
      rawHref.startsWith("//")
    ) {
      continue;
    }

    const cleanedHref = rawHref.split(/[?#]/)[0];
    if (!cleanedHref) {
      continue;
    }

    const targetPath = cleanedHref.startsWith("/")
      ? path.resolve(rootDir, cleanedHref.slice(1))
      : path.resolve(dir, cleanedHref);

    if (!fs.existsSync(targetPath)) {
      errors.push(
        `${path.relative(rootDir, filePath)} -> ${rawHref} (missing ${path.relative(
          rootDir,
          targetPath
        )})`
      );
    }
  }
}

if (errors.length > 0) {
  console.error("Broken local links found:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} HTML file(s). No broken local links found.`);
