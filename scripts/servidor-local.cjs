// ══════════════════════════════════════════
//  Servidor estático para desarrollo
//
//  El repo se despliega en Vercel sin paso de build: lo que hay es lo que se
//  sirve. Esto hace lo mismo en local, sin instalar nada. Se usa node a secas
//  porque `npx serve` se descarga en el primer arranque y aquí no hace falta.
//
//  Puerto 3456, que es el que está en la lista blanca de CORS de api/, así que
//  el calendario funciona en local contra la API de producción.
//
//      node scripts/servidor-local.cjs
// ══════════════════════════════════════════

const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO = process.env.PORT || 3456;

const TIPOS = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.json': 'application/json; charset=utf-8',
    '.woff2': 'font/woff2',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const rel = url === '/' ? '/index.html' : url;
    const destino = path.join(RAIZ, rel);

    // Nada fuera de la raíz del repo
    if (!destino.startsWith(RAIZ)) {
        res.writeHead(403).end('Prohibido');
        return;
    }

    fs.readFile(destino, (err, buf) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 ' + rel);
            return;
        }
        res.writeHead(200, {
            'Content-Type': TIPOS[path.extname(destino).toLowerCase()] || 'application/octet-stream',
            // Sin caché: en desarrollo molesta más de lo que ayuda
            'Cache-Control': 'no-store',
        });
        res.end(buf);
    });
}).listen(PUERTO, '127.0.0.1', () => {
    console.log('Calculadora DAK en http://127.0.0.1:' + PUERTO);
});
