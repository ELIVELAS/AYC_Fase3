import { execute } from "./ejecutar.js";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = normalize(join(__dirname, "..", "interfaz"));
const port = 3000;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

const server = http.createServer(async (req, res) => {
  try {
    if(req.url==='/api/ejecutar' && req.method==='POST') {
      res.setHeader('Content-Type','application/json; charset=utf-8');
      try {
        let body='';for await(const chunk of req){body+=chunk;if(body.length>100000)throw new Error('Solicitud demasiado grande');}
        const {source,language,inputs}=JSON.parse(body);
        if(typeof source!=='string'||!['JavaScript','Python'].includes(language)||!Array.isArray(inputs)||!inputs.every(Number.isFinite))throw new Error('Datos inválidos');
        res.end(JSON.stringify({output:execute(source,language,inputs)}));
      }catch(e){res.statusCode=400;res.end(JSON.stringify({error:e.message}));}
      return;
    }
    const rawPath = decodeURIComponent((req.url || "/").split("?")[0]);
    const relative = rawPath === "/" ? "index.html" : rawPath.replace(/^\/+/, "");
    const filePath = normalize(join(publicDir, relative));

    if (!filePath.startsWith(publicDir + (process.platform === "win32" ? "\\" : "/"))) {
      res.writeHead(403);
      res.end("Acceso denegado");
      return;
    }

    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": mime[extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Archivo no encontrado");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Interfaz disponible en http://localhost:${port}`);
  console.log("Presiona Ctrl+C para detener el servidor.");
});
