#!/usr/bin/env node
// Static QA audit: automates the parts of docs/qa.md, docs/content-style.md,
// docs/anti-ai.md and docs/accessibility.md that can be checked without a
// browser. It complements, not replaces, the manual checklist in docs/qa.md.
// Usage: npm run qa

import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "src");
const PUBLIC_DIR = path.join(ROOT, "public");
const DOCS_DIR = path.join(ROOT, "docs");
const INDEX_HTML = path.join(ROOT, "index.html");
const PACKAGE_JSON = path.join(ROOT, "package.json");
const TOKENS_CSS = path.join(SRC_DIR, "styles", "tokens.css");

const IGNORE_DIRS = new Set(["node_modules", "dist", ".git", ".vite"]);

/** @typedef {{ level: "FAIL" | "WARN", section: string, message: string, location?: string }} Finding */

/** @type {Finding[]} */
const findings = [];

function fail(section, message, location) {
  findings.push({ level: "FAIL", section, message, location });
}

function warn(section, message, location) {
  findings.push({ level: "WARN", section, message, location });
}

function walk(dir, exts) {
  if (!existsSync(dir)) return [];
  let results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walk(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

function relative(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function forEachLine(file, callback) {
  const content = readFileSync(file, "utf8");
  content.split(/\r?\n/).forEach((line, index) => callback(line, index + 1));
}

// --- Content (docs/content-style.md) ---

// These two docs quote the em-dash as a literal example of what to avoid
// (a table row, a sample grep command): that is the rule's own definition,
// not a violation of it.
const EM_DASH_EXEMPT = new Set([
  path.join(DOCS_DIR, "content-style.md"),
  path.join(DOCS_DIR, "qa.md"),
]);

function checkEmDash() {
  const files = [
    ...walk(SRC_DIR, [".js", ".jsx", ".ts", ".tsx", ".css"]),
    ...walk(DOCS_DIR, [".md"]),
    ...readdirSync(ROOT)
      .filter((name) => name.endsWith(".md"))
      .map((name) => path.join(ROOT, name)),
  ].filter((file) => !EM_DASH_EXEMPT.has(file));
  for (const file of files) {
    forEachLine(file, (line, lineNumber) => {
      if (line.includes("—")) {
        fail(
          "Content",
          "Em-dash used as a clause separator (docs/content-style.md bans this outright).",
          `${relative(file)}:${lineNumber}`,
        );
      }
    });
  }
}

const BANNED_PHRASES = [
  "transforme o seu negocio",
  "transforme o seu negócio",
  "elevate your experience",
  "the future starts here",
  "discover new possibilities",
  "unlock your potential",
  "empower your business",
];

function checkBannedPhrases() {
  const files = walk(SRC_DIR, [".jsx", ".js", ".tsx", ".ts"]);
  for (const file of files) {
    forEachLine(file, (line, lineNumber) => {
      const normalized = line.toLowerCase();
      for (const phrase of BANNED_PHRASES) {
        if (normalized.includes(phrase)) {
          fail(
            "Content",
            `Generic filler copy with no real referent: "${phrase}" (docs/anti-ai.md#copy).`,
            `${relative(file)}:${lineNumber}`,
          );
        }
      }
    });
  }
}

const BUZZWORDS = [
  "seamless",
  "leverage",
  "elevate",
  "unlock",
  "empower",
  "robust",
  "cutting-edge",
  "game-changing",
  "synergy",
  "holistic",
];

function checkBuzzwordDensity() {
  const files = walk(SRC_DIR, [".jsx", ".js", ".tsx", ".ts"]);
  const found = new Set();
  for (const file of files) {
    const content = readFileSync(file, "utf8").toLowerCase();
    for (const word of BUZZWORDS) {
      if (content.includes(word)) found.add(word);
    }
  }
  if (found.size >= 3) {
    warn(
      "Content",
      `${found.size} distinct buzzwords found across copy (${[...found].join(", ")}). One is fine, several together reads as AI-generated (docs/content-style.md).`,
    );
  }
}

// --- Token discipline (BLUEPRINT.md, docs/design-system.md) ---

const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/g;

function checkArbitraryHexColors() {
  const files = walk(SRC_DIR, [".jsx", ".js", ".tsx", ".ts", ".css"]).filter(
    (file) => file !== TOKENS_CSS,
  );
  for (const file of files) {
    forEachLine(file, (line, lineNumber) => {
      const matches = line.match(HEX_COLOR);
      if (matches) {
        warn(
          "Tokens",
          `Hardcoded color ${matches.join(", ")} outside tokens.css. Components should consume semantic --color-* tokens (docs/design-system.md).`,
          `${relative(file)}:${lineNumber}`,
        );
      }
    });
  }
}

function checkArbitraryZIndex() {
  const files = walk(SRC_DIR, [".css"]);
  for (const file of files) {
    forEachLine(file, (line, lineNumber) => {
      const match = line.match(/z-index\s*:\s*([^;]+);/);
      if (match && !match[1].includes("var(--z-")) {
        warn(
          "Tokens",
          `z-index: ${match[1].trim()} does not come from a --z-* token (BLUEPRINT.md: "--z-* is the only place a z-index value should come from").`,
          `${relative(file)}:${lineNumber}`,
        );
      }
    });
  }
}

// --- Accessibility (docs/accessibility.md) ---

function checkImagesWithoutAlt() {
  const files = walk(SRC_DIR, [".jsx", ".tsx"]);
  for (const file of files) {
    forEachLine(file, (line, lineNumber) => {
      const imgTags = line.match(/<img\b[^>]*>/g);
      if (!imgTags) return;
      for (const tag of imgTags) {
        if (!/\balt\s*=/.test(tag)) {
          fail(
            "Accessibility",
            "<img> without an alt attribute.",
            `${relative(file)}:${lineNumber}`,
          );
        }
      }
    });
  }
}

function checkMultipleH1() {
  const pagesDir = path.join(SRC_DIR, "pages");
  // Laboratory is the token/component QA page: it deliberately renders
  // every heading level side by side to show the type scale, so it is
  // exempt from the "one <h1> per page" rule that applies to real pages.
  const files = walk(pagesDir, [".jsx", ".tsx"]).filter(
    (file) => !path.basename(file).startsWith("Laboratory"),
  );
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const count = (content.match(/<h1\b/g) || []).length;
    if (count > 1) {
      fail(
        "Accessibility",
        `${count} <h1> elements in one page component. One <h1> per page (docs/accessibility.md).`,
        relative(file),
      );
    }
  }
}

function checkClickableDivs() {
  const files = walk(SRC_DIR, [".jsx", ".tsx"]);
  for (const file of files) {
    forEachLine(file, (line, lineNumber) => {
      if (/<div\b[^>]*onClick/.test(line) && !/role\s*=/.test(line)) {
        warn(
          "Accessibility",
          "<div onClick> without a role: prefer a real <button>/<a>, or add role + keyboard handling (docs/accessibility.md).",
          `${relative(file)}:${lineNumber}`,
        );
      }
    });
  }
}

function checkDuplicateIds() {
  const files = walk(SRC_DIR, [".jsx", ".tsx"]);
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const ids = content.match(/\bid=["'][^"']+["']/g) || [];
    const seen = new Map();
    for (const raw of ids) {
      seen.set(raw, (seen.get(raw) || 0) + 1);
    }
    for (const [raw, count] of seen) {
      if (count > 1) {
        warn(
          "Accessibility",
          `Duplicate ${raw} appears ${count} times in the same component.`,
          relative(file),
        );
      }
    }
  }
}

// --- SEO / technical baseline (a recurring gap found when auditing projects built on this foundation) ---

function checkSeoBaseline() {
  if (!existsSync(PUBLIC_DIR)) {
    fail("SEO", "public/ directory does not exist.");
    return;
  }
  const publicFiles = readdirSync(PUBLIC_DIR);
  const has = (pattern) => publicFiles.some((name) => pattern.test(name));
  if (!has(/favicon/i)) fail("SEO", "No favicon in public/.");
  if (!has(/^robots\.txt$/i)) fail("SEO", "No robots.txt in public/.");
  if (!has(/^sitemap\.xml$/i)) warn("SEO", "No sitemap.xml in public/.");

  if (!existsSync(INDEX_HTML)) {
    fail("SEO", "index.html not found.");
    return;
  }
  const html = readFileSync(INDEX_HTML, "utf8");
  if (!/<meta\s+name=["']description["']/.test(html)) {
    fail("SEO", "index.html has no <meta name=\"description\">.");
  }
  if (!/<meta\s+property=["']og:title["']/.test(html)) {
    warn("SEO", "index.html has no og:title.");
  }
  if (!/<meta\s+property=["']og:image["']/.test(html)) {
    warn(
      "SEO",
      "index.html has no og:image: link previews will show no image.",
    );
  }
}

// --- Dependency hygiene (docs/agent-protocol.md, docs/performance.md) ---

function checkUnusedDependencies() {
  if (!existsSync(PACKAGE_JSON)) return;
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, "utf8"));
  const deps = Object.keys(pkg.dependencies || {});
  if (deps.length === 0) return;

  const sourceFiles = walk(SRC_DIR, [".js", ".jsx", ".ts", ".tsx"]);
  const combined = sourceFiles
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");

  for (const dep of deps) {
    const escaped = dep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Allow subpath imports (e.g. "react-dom/client") to count as usage.
    const importPattern = new RegExp(
      `from\\s+["']${escaped}(?:/[^"']*)?["']|require\\(["']${escaped}(?:/[^"']*)?["']\\)`,
    );
    if (!importPattern.test(combined)) {
      warn(
        "Dependencies",
        `"${dep}" is declared in package.json but never imported in src/ (docs/performance.md: "dependencies must earn their weight").`,
      );
    }
  }
}

// --- Deploy: caminhos dos assets (docs/lessons-learned.md, 2026-10-02) ---

// Com base './' as rotas em subcaminho (/seguros/automovel) pedem /seguros/assets/… e,
// ao abrir o link direto, a Vercel devolve o index.html: página em branco em produção.
function checkAbsoluteBase() {
  const config = path.join(ROOT, "vite.config.ts");
  if (!existsSync(config)) return;
  const base = /\bbase:\s*["']([^"']*)["']/.exec(readFileSync(config, "utf8"))?.[1];
  if (base !== undefined && !base.startsWith("/")) {
    fail("Deploy", `vite.config.ts tem base "${base}": use "/" para as rotas em subcaminho carregarem ao abrir o link direto.`, "vite.config.ts");
  }
}

// --- Lançamento: nada por confirmar quando o site sai do noindex ---

// Lançado = o vercel.json já não tem a regra de noindex sem `missing` (documento.md, secção 4).
function siteLancado() {
  const config = path.join(ROOT, "vercel.json");
  if (!existsSync(config)) return false;
  const { headers = [] } = JSON.parse(readFileSync(config, "utf8").trimStart());
  return !headers.some(
    (regra) => !regra.missing && regra.headers?.some((h) => h.key.toLowerCase() === "x-robots-tag" && /noindex/i.test(h.value)),
  );
}

function pendentesLancamento() {
  const pendentes = [];
  const empresa = path.join(SRC_DIR, "data", "empresa.ts");
  const confirmados = new Set();
  if (existsSync(empresa)) {
    for (const [, campo, estado] of readFileSync(empresa, "utf8").matchAll(/(\w+):\s*\{\s*valor:\s*"[^"]*",\s*confirmado:\s*(true|false)\s*\}/g)) {
      if (estado === "true") confirmados.add(campo);
      else pendentes.push([`Dado da empresa por confirmar: ${campo}.`, "src/data/empresa.ts"]);
    }
  }
  // O MapaGoogle só mostra o seu aviso enquanto a morada estiver por confirmar, já contada acima.
  const MARCA_GOVERNADA = path.join(SRC_DIR, "components", "ui", "MapaGoogle.tsx");
  for (const file of walk(SRC_DIR, [".ts", ".tsx"])) {
    if (file === empresa || file === MARCA_GOVERNADA) continue;
    forEachLine(file, (line, n) => {
      if (/fict[ií]ci/i.test(line)) pendentes.push(["Texto fictício.", `${relative(file)}:${n}`]);
      else if (/Por confirmar:|porConfirmar:\s*true/.test(line)) pendentes.push(["Conteúdo marcado por confirmar.", `${relative(file)}:${n}`]);
    });
  }
  for (const file of walk(path.join(SRC_DIR, "pages", "legal"), [".tsx"])) {
    forEachLine(file, (line, n) => {
      if (/\[[A-Za-zÀ-ú]/.test(line)) pendentes.push(["Parênteses retos por preencher na página legal.", `${relative(file)}:${n}`]);
    });
  }
  if (existsSync(INDEX_HTML)) {
    const html = readFileSync(INDEX_HTML, "utf8");
    if (/gtag\/js\?id=G-X+"/.test(html)) pendentes.push(["ID do Google Analytics 4 ainda é o placeholder (ou retirar o GA4).", "index.html"]);
    if (/fbq\('init',\s*'PIXEL_ID_AQUI'\)/.test(html)) pendentes.push(["ID do Meta Pixel ainda é o placeholder (ou retirar o Pixel).", "index.html"]);
    const jsonLd = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
    if (confirmados.has("telefone") && !/"telephone"/.test(jsonLd)) pendentes.push(["Telefone confirmado mas ausente do JSON-LD.", "index.html"]);
    if (confirmados.has("morada") && !/"address"/.test(jsonLd)) pendentes.push(["Morada confirmada mas ausente do JSON-LD.", "index.html"]);
  }
  return pendentes;
}

function checkLancamento() {
  const lancado = siteLancado();
  for (const [mensagem, local] of pendentesLancamento()) {
    if (lancado) fail("Lançamento", `${mensagem} O site já não tem noindex.`, local);
    else warn("Lançamento", mensagem, local);
  }
}

// --- Run ---

checkEmDash();
checkBannedPhrases();
checkBuzzwordDensity();
checkArbitraryHexColors();
checkArbitraryZIndex();
checkImagesWithoutAlt();
checkMultipleH1();
checkClickableDivs();
checkDuplicateIds();
checkSeoBaseline();
checkUnusedDependencies();
checkAbsoluteBase();
checkLancamento();

const sections = [...new Set(findings.map((f) => f.section))];
const failCount = findings.filter((f) => f.level === "FAIL").length;
const warnCount = findings.filter((f) => f.level === "WARN").length;

if (findings.length === 0) {
  console.log("QA audit: no issues found.\n");
} else {
  for (const section of sections) {
    console.log(`\n${section}`);
    console.log("-".repeat(section.length));
    for (const finding of findings.filter((f) => f.section === section)) {
      const location = finding.location ? ` (${finding.location})` : "";
      console.log(`  [${finding.level}] ${finding.message}${location}`);
    }
  }
  console.log(`\n${failCount} failure(s), ${warnCount} warning(s).\n`);
}

console.log(
  "This covers only what is checkable without a browser. Still run the manual checklist in docs/qa.md (responsive breakpoints, keyboard traversal, cookie consent flow, contrast) before calling a change done.\n",
);

process.exit(failCount > 0 ? 1 : 0);
