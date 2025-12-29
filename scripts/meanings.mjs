#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const hskPath = path.join(repoRoot, "src", "data", "hsk.json");
const meaningsDir = path.join(repoRoot, "src", "data", "meanings");

function usage(exitCode = 0) {
  console.log(`\nUsage:\n  node scripts/meanings.mjs validate\n  node scripts/meanings.mjs init <lang>\n\nExamples:\n  node scripts/meanings.mjs init es\n  node scripts/meanings.mjs validate\n`);
  process.exit(exitCode);
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function loadIdSet() {
  const cards = await readJson(hskPath);
  if (!Array.isArray(cards)) {
    throw new Error("src/data/hsk.json must be a JSON array");
  }
  const ids = new Set();
  for (const card of cards) {
    if (card && typeof card.id === "string") ids.add(card.id);
  }
  return ids;
}

async function validate() {
  const ids = await loadIdSet();

  let entries;
  try {
    entries = await fs.readdir(meaningsDir, { withFileTypes: true });
  } catch (e) {
    if (e && e.code === "ENOENT") {
      console.log("No src/data/meanings directory; nothing to validate.");
      return;
    }
    throw e;
  }

  const jsonFiles = entries
    .filter((d) => d.isFile() && d.name.endsWith(".json"))
    .map((d) => path.join(meaningsDir, d.name));

  const errors = [];

  for (const filePath of jsonFiles) {
    let obj;
    try {
      obj = await readJson(filePath);
    } catch (e) {
      errors.push(`${path.relative(repoRoot, filePath)}: invalid JSON (${e.message})`);
      continue;
    }

    if (!obj || Array.isArray(obj) || typeof obj !== "object") {
      errors.push(`${path.relative(repoRoot, filePath)}: expected a JSON object mapping id -> string`);
      continue;
    }

    for (const [key, value] of Object.entries(obj)) {
      if (!ids.has(key)) {
        errors.push(`${path.relative(repoRoot, filePath)}: unknown id '${key}'`);
        continue;
      }
      if (typeof value !== "string") {
        errors.push(`${path.relative(repoRoot, filePath)}: value for '${key}' must be a string`);
        continue;
      }
      if (value.trim().length === 0) {
        errors.push(`${path.relative(repoRoot, filePath)}: value for '${key}' is empty; omit the key instead`);
      }
    }
  }

  if (errors.length) {
    console.error("Meaning translation validation failed:\n" + errors.map((e) => `- ${e}`).join("\n"));
    process.exit(1);
  }

  console.log(`OK: validated ${jsonFiles.length} meaning translation file(s).`);
}

async function init(lang) {
  if (!lang || typeof lang !== "string") usage(1);

  await fs.mkdir(meaningsDir, { recursive: true });
  const filePath = path.join(meaningsDir, `${lang}.json`);

  try {
    await fs.access(filePath);
    console.log(`${path.relative(repoRoot, filePath)} already exists.`);
    return;
  } catch {
    // ok
  }

  await fs.writeFile(filePath, "{}\n", "utf8");
  console.log(`Created ${path.relative(repoRoot, filePath)}`);
}

const [command, arg] = process.argv.slice(2);

try {
  if (command === "validate") {
    await validate();
  } else if (command === "init") {
    await init(arg);
  } else {
    usage(command ? 1 : 0);
  }
} catch (e) {
  console.error(e?.stack || String(e));
  process.exit(1);
}
