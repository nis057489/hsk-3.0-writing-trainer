#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const vocabPath = path.join(repoRoot, "src", "data", "hsk.json");
const outPath = path.join(repoRoot, "src", "data", "frequencyTop.json");

function isNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function computeTopIds(cards, limit) {
  const eligible = cards
    .filter((c) => c && typeof c.id === "string")
    .filter((c) => !Array.isArray(c.level) || !c.level.includes("radical"))
    .filter((c) => isNumber(c.frequency));

  eligible.sort((a, b) => a.frequency - b.frequency);

  const out = [];
  const seen = new Set();
  for (const c of eligible) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c.id);
    if (out.length >= limit) break;
  }
  return out;
}

async function main() {
  const cards = await readJson(vocabPath);
  if (!Array.isArray(cards)) {
    throw new Error("src/data/hsk.json must be a JSON array");
  }

  const top1000 = computeTopIds(cards, 1000);
  const top3000 = computeTopIds(cards, 3000);
  const top5000 = computeTopIds(cards, 5000);

  const payload = {
    top1000,
    top3000,
    top5000
  };

  await fs.writeFile(outPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Wrote ${path.relative(repoRoot, outPath)} (top1000=${top1000.length}, top3000=${top3000.length}, top5000=${top5000.length})`);
}

main().catch((e) => {
  console.error(e?.stack || String(e));
  process.exit(1);
});
