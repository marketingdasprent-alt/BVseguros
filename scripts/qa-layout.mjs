#!/usr/bin/env node
// Layout QA in a real browser (Chrome headless over the DevTools
// Protocol, no extra dependency). For every page and width it checks:
//   1. no horizontal page scroll;
//   2. the "V" rule: in any set of boxes that wraps into several rows,
//      the last row is centred under the first (see .card-grid in
//      src/styles/layout.css);
//   3. an even number of boxes fills equal rows (4 -> 2+2, never 3+1);
//   4. boxes side by side in the same row have the same height;
//   5. centred text is in a centred box (a narrower <p> must not hug the left);
//   6. boxes side by side start their content at the same height.
//   Forms, dialogs and horizontal scrollers are exempt from 2-4 and 6.
// Usage: npm run dev (other terminal), then
//   npm run qa:layout [-- --url=http://localhost:5190] [--shots=dir]
// Needs Chrome or Edge; set CHROME_PATH if it is not in a standard place.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")).map(([k, v]) => [k, v ?? true])
);
const BASE = (args.url || "http://localhost:5190").replace(/\/$/, "");
const SHOTS = typeof args.shots === "string" ? path.resolve(args.shots) : null;
const WIDTHS = [375, 768, 1024, 1280, 1440];

// Routes: the fixed pages plus one page per ramo, read from the data file.
const seguros = readFileSync(path.join(ROOT, "src/data/seguros.ts"), "utf8");
const slugs = [...seguros.matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]);
// Pedidos: o genérico, o de um ramo com mais passos (automóvel) e o de sinistro.
const ROUTES = [
  "/", "/seguros", ...slugs.map((s) => `/seguros/${s}`), "/sinistros",
  "/pedir-proposta", "/pedir-proposta/automovel", "/participar-sinistro",
  "/privacy", "/terms", "/cookies",
];

const CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const CHROME = CANDIDATES.find((c) => existsSync(c));
if (!CHROME) {
  console.error("Chrome/Edge not found. Set CHROME_PATH.");
  process.exit(2);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9400 + Math.floor(Math.random() * 400);
const profile = path.join(tmpdir(), `qa-layout-${port}`);
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"]);

let target;
for (let i = 0; i < 120 && !target; i++) {
  await wait(250);
  try {
    target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
  } catch {
    /* Chrome still starting */
  }
}
if (!target) {
  console.error("Could not connect to Chrome.");
  chrome.kill();
  process.exit(2);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let seq = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
});
const send = (method, params = {}) =>
  new Promise((r) => {
    const id = ++seq;
    pending.set(id, r);
    ws.send(JSON.stringify({ id, method, params }));
  });

// Runs in the page. Returns problems as plain strings.
const AUDIT = `(() => {
  const problems = [];
  const overflow = document.documentElement.scrollWidth - innerWidth;
  if (overflow > 1) problems.push("horizontal scroll: " + overflow + "px");

  const describe = (el) => {
    const id = el.id ? "#" + el.id : "";
    const cls = typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\\s+/).slice(0, 2).join(".") : "";
    const section = el.closest("section[id]");
    return el.tagName.toLowerCase() + id + cls + (section && section !== el ? " in #" + section.id : "");
  };
  const isBox = (el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || el.offsetWidth === 0) return false;
    const rounded = parseFloat(s.borderTopLeftRadius) > 0;
    const bordered = ["Top", "Right", "Bottom", "Left"].some((k) => parseFloat(s["border" + k + "Width"]) > 0);
    const shadow = s.boxShadow !== "none";
    return rounded && (bordered || shadow);
  };

  for (const parent of document.querySelectorAll("body *")) {
    if (parent.closest("form, dialog, [aria-hidden='true']")) continue;
    if (parent.scrollWidth > parent.clientWidth + 1 && getComputedStyle(parent).overflowX !== "visible") continue;
    const kids = [...parent.children].filter((k) => k.offsetParent !== null);
    if (kids.length < 2) continue;
    const boxes = kids.filter((k) => isBox(k) || (k.children.length === 1 && isBox(k.children[0])));
    if (boxes.length < kids.length || boxes.length < 2) continue;

    const rows = [];
    for (const k of kids) {
      // The visible box is the child itself or its only child (li > button).
      const box = isBox(k) ? k : k.children[0];
      const b = box.getBoundingClientRect();
      const first = [...box.children].find((c) => c.offsetWidth > 0);
      const r = { left: b.left, right: b.right, top: b.top, height: b.height, firstTop: first ? first.getBoundingClientRect().top : b.top };
      const row = rows.find((x) => Math.abs(x.top - r.top) < 4);
      if (row) row.items.push(r);
      else rows.push({ top: r.top, items: [r] });
    }
    for (const row of rows) {
      const heights = row.items.map((r) => r.height);
      if (row.items.length > 1 && Math.max(...heights) - Math.min(...heights) > 2) {
        problems.push("uneven heights in a row (" + heights.map(Math.round).join("/") + "px) in " + describe(parent));
        break;
      }
      // 6. Boxes in a row start their content on the same line (icon, label).
      const starts = row.items.map((r) => r.firstTop - r.top);
      if (row.items.length > 1 && Math.max(...starts) - Math.min(...starts) > 2) {
        problems.push("content starts at different heights in a row (" + starts.map(Math.round).join("/") + "px) in " + describe(parent));
        break;
      }
    }
    if (rows.length < 2) continue;
    const counts = rows.map((r) => r.items.length);
    if (kids.length % 2 === 0 && new Set(counts).size > 1) {
      problems.push("even count in unequal rows (" + counts.join("+") + ") in " + describe(parent));
    }
    const span = (row) => ({
      left: Math.min(...row.items.map((r) => r.left)),
      right: Math.max(...row.items.map((r) => r.right)),
    });
    const first = span(rows[0]);
    const last = span(rows[rows.length - 1]);
    const off = (last.left + last.right) / 2 - (first.left + first.right) / 2;
    if (Math.abs(off) > 2) {
      problems.push("V rule: last row off-centre by " + Math.round(off) + "px (" + rows.map((r) => r.items.length).join("+") + ") in " + describe(parent));
    }
  }

  // 5. Centred text sits in a centred box: a block narrower than its parent
  //    (p { max-width: 70ch }) with text-align: center must not hug the left.
  for (const el of document.querySelectorAll("body p, body h1, body h2, body h3, body h4, body li, body div")) {
    if (el.closest("[aria-hidden='true'], dialog")) continue;
    const s = getComputedStyle(el);
    if (s.textAlign !== "center" || s.display !== "block" || el.offsetWidth === 0 || !el.textContent.trim()) continue;
    const parent = el.parentElement;
    const ps = getComputedStyle(parent);
    if (ps.display === "flex" || ps.display === "grid" || ps.display === "inline-flex") continue;
    const pr = parent.getBoundingClientRect();
    const innerLeft = pr.left + parseFloat(ps.paddingLeft) + parseFloat(ps.borderLeftWidth);
    const innerRight = pr.right - parseFloat(ps.paddingRight) - parseFloat(ps.borderRightWidth);
    const r = el.getBoundingClientRect();
    if (innerRight - innerLeft - r.width < 4) continue;
    const off = (r.left + r.right) / 2 - (innerLeft + innerRight) / 2;
    if (Math.abs(off) > 2) problems.push("centred text in an off-centre box (" + Math.round(off) + "px): " + describe(el));
  }
  return problems;
})()`;

if (SHOTS) mkdirSync(SHOTS, { recursive: true });
await send("Page.enable");
let failures = 0;
for (const width of WIDTHS) {
  await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
  for (const route of ROUTES) {
    await send("Page.navigate", { url: BASE + route });
    await wait(1400);
    const result = await send("Runtime.evaluate", { expression: AUDIT, returnByValue: true });
    const problems = result.result?.result?.value ?? ["audit script failed"];
    for (const p of problems) {
      failures++;
      console.log(`FAIL ${width}px ${route}: ${p}`);
    }
    if (SHOTS) {
      const metrics = await send("Page.getLayoutMetrics");
      const height = Math.ceil(metrics.result.cssContentSize.height);
      const shot = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width, height, scale: 1 },
      });
      const name = `${width}-${route === "/" ? "home" : route.slice(1).replace(/\//g, "_")}.png`;
      writeFileSync(path.join(SHOTS, name), Buffer.from(shot.result.data, "base64"));
    }
  }
}

ws.close();
chrome.kill();
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  /* profile still locked by the exiting browser */
}
console.log(
  failures
    ? `\n${failures} layout problem(s) across ${ROUTES.length} pages x ${WIDTHS.length} widths.`
    : `Layout QA: ${ROUTES.length} pages x ${WIDTHS.length} widths, no problems.`
);
process.exit(failures ? 1 : 0);
