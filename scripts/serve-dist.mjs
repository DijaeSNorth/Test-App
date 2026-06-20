import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const port = Number(process.env.PORT ?? 5173);

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const cleanPath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const requested = path.resolve(root, cleanPath);
  const relativePath = path.relative(root, requested);
  const isSafePath = relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
  const isExistingFile = isSafePath && existsSync(requested) && statSync(requested).isFile();
  const safePath = isExistingFile ? requested : path.join(root, "index.html");

  try {
    const body = await readFile(safePath);
    response.writeHead(200, {
      "content-type": types[path.extname(safePath)] ?? "application/octet-stream",
      "cache-control": "no-store"
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Hourforge running at http://127.0.0.1:${port}`);
});
