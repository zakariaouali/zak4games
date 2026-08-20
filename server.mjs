import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 5173);
const sourceDataUrl = "https://bulkgames.store/shop/data";
let cachedGames = null;
let cachedAt = 0;
const cacheTtlMs = 5 * 60 * 1000;
const imageCache = new Map();
const imageCacheTtlMs = 24 * 60 * 60 * 1000;

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
]);

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": contentTypes.get(ext) || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  createReadStream(filePath).pipe(res);
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/games") {
    try {
      if (!cachedGames || Date.now() - cachedAt > cacheTtlMs) {
        const response = await fetch(sourceDataUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to load source catalog (${response.status})`);
        }

        const data = await response.json();
        cachedGames = data.games || [];
        cachedAt = Date.now();
      }

      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(cachedGames));
      return;
    } catch (error) {
      res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: error.message, games: [] }));
      return;
    }
  }

  if (url.pathname === "/api/image") {
    const target = url.searchParams.get("url");
    if (!target) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Missing url");
      return;
    }

    try {
      const cached = imageCache.get(target);
      if (cached && Date.now() - cached.at < imageCacheTtlMs) {
        res.writeHead(200, {
          "Content-Type": cached.contentType,
          "Content-Length": cached.buffer.length,
          "Cache-Control": "no-store",
        });
        res.end(cached.buffer);
        return;
      }

      const response = await fetch(target, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load image (${response.status})`);
      }

      const contentType = response.headers.get("content-type") || "application/octet-stream";
      const buffer = Buffer.from(await response.arrayBuffer());
      imageCache.set(target, { buffer, contentType, at: Date.now() });

      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": buffer.length,
        "Cache-Control": "no-store",
      });
      res.end(buffer);
      return;
    } catch (error) {
      res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(error.message);
      return;
    }
  }

  const safePath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(rootDir, safePath));

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (fileStat.isFile()) {
      sendFile(res, filePath);
      return;
    }
  } catch {
    // fall through to 404
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
}

createServer(handleRequest).listen(port, () => {
  console.log(`Steam Game Store running at http://localhost:${port}`);
});
