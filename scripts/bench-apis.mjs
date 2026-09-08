#!/usr/bin/env node
/** Quick API latency + payload check. Usage: node scripts/bench-apis.mjs [baseUrl] */

const base = (process.argv[2] ?? "https://send-studio.vercel.app").replace(/\/$/, "");

const paths = [
  "/api/contacts",
  "/api/templates?includeArchived=true",
  "/api/campaigns?includeArchived=true",
  "/api/campaigns/bootstrap",
];

async function bench(path) {
  const url = `${base}${path}`;
  const t0 = performance.now();
  const res = await fetch(url);
  const body = await res.text();
  const ms = Math.round(performance.now() - t0);
  let shape = "";
  try {
    const j = JSON.parse(body);
    if (Array.isArray(j) && j[0]) {
      const keys = Object.keys(j[0]).sort();
      shape = `keys=[${keys.join(", ")}] blocks=${j.some((x) => "blocks" in x)} blockCount=${j.some((x) => "blockCount" in x)}`;
    } else if (j && typeof j === "object" && !j.error) {
      shape = `keys=[${Object.keys(j).join(", ")}]`;
      if (Array.isArray(j.templates?.[0])) shape += "";
      else if (j.templates?.[0]) {
        const t = j.templates[0];
        shape += ` tpl=[${Object.keys(t).join(", ")}] blockCount=${t.blockCount ?? "—"}`;
      }
    } else if (j?.error) {
      shape = `error=${j.error}`;
    }
  } catch {
    shape = body.slice(0, 80);
  }
  return { path, status: res.status, ms, bytes: body.length, shape };
}

console.log(`Base: ${base}\n`);
for (const path of paths) {
  const r = await bench(path);
  console.log(
    `${r.path}\n  → HTTP ${r.status} | ${r.ms}ms | ${r.bytes} bytes\n  → ${r.shape}\n`,
  );
}

// Campaigns page: old = 4 requests, new = 1 bootstrap
console.log("--- Simulação /campaigns ---");
const oldPaths = paths.slice(0, 3).concat("/api/campaigns/sender-defaults");
let oldMs = 0;
let oldBytes = 0;
for (const p of oldPaths) {
  const t0 = performance.now();
  const res = await fetch(`${base}${p}`);
  const body = await res.text();
  oldMs += performance.now() - t0;
  oldBytes += body.length;
}
const t0 = performance.now();
const boot = await fetch(`${base}/api/campaigns/bootstrap`);
const bootBody = await boot.text();
const bootMs = performance.now() - t0;
console.log(`  Antigo (4 requests): ~${Math.round(oldMs)}ms | ${oldBytes} bytes total`);
console.log(
  `  Novo (bootstrap):    ${boot.status} ${Math.round(bootMs)}ms | ${bootBody.length} bytes`,
);
