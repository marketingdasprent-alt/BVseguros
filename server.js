/* ============================================================
   BV SEGUROS — servidor de desenvolvimento
   Servidor estático nativo (módulo http), sem dependências.
   Uso:  npm start   ->   http://localhost:8090

   A porta é 8090 para não colidir com o CRM (crm/, porta 5183)
   nem com os outros sites da equipa (8080, 8081, ...).
   ============================================================ */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT) || 8090;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2"
};

const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; " +
    "form-action mailto:; frame-ancestors 'none'; object-src 'none'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
};

function send(res, status, headers, body) {
  res.writeHead(status, Object.assign({}, SECURITY_HEADERS, headers));
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405,
      { "Content-Type": "text/plain; charset=utf-8", Allow: "GET, HEAD" },
      "405 Method Not Allowed");
  }

  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split("?")[0]);
  } catch (e) {
    return send(res, 400, { "Content-Type": "text/plain; charset=utf-8" }, "400 Bad Request");
  }
  if (urlPath === "/") urlPath = "/index.html";

  // Nunca servir a app do CRM (crm/) a partir deste servidor — vive no seu próprio Vite dev server.
  if (urlPath.startsWith("/crm/") || urlPath === "/crm") {
    return send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "404 Not Found");
  }

  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    return send(res, 403, { "Content-Type": "text/plain; charset=utf-8" }, "403 Forbidden");
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      return send(res, 404, { "Content-Type": "text/html; charset=utf-8" },
        "<!doctype html><meta charset='utf-8'><title>404 — BV Seguros</title>" +
        "<body style=\"font-family:sans-serif;background:#f5f6f8;color:#101828;" +
        "display:grid;place-items:center;height:100vh;margin:0\">" +
        "<div style='text-align:center'><h1 style='font-size:3.5rem;margin:0 0 .5rem'>404</h1>" +
        "<p>Página não encontrada. <a href='/' style='color:#184070'>Voltar ao início</a></p></div>");
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    const headers = {
      "Content-Type": type,
      "Content-Length": stat.size,
      "Cache-Control": "no-cache"
    };

    if (req.method === "HEAD") return send(res, 200, headers, "");

    res.writeHead(200, Object.assign({}, SECURITY_HEADERS, headers));
    const stream = fs.createReadStream(filePath);
    stream.on("error", () => { res.destroy(); });
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log("\n  BV SEGUROS — servidor de desenvolvimento");
  console.log("  ------------------------------------------------");
  console.log("  A correr em:  http://" + HOST + ":" + PORT);
  console.log("  Parar:        Ctrl + C\n");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error("\n  [erro] A porta " + PORT + " já está em uso.");
    console.error("  Tente outra porta:  PORT=4000 npm start\n");
  } else {
    console.error(err);
  }
  process.exit(1);
});
