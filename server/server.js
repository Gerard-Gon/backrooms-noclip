// BACKROOMS MMO — servidor: estáticos del juego + WebSocket de salas.
// Uso: node server/server.js [puerto]   (por defecto 8080)
// En producción va detrás de Caddy (TLS); en desarrollo se abre
// http://localhost:8080 directamente (mismo origen para el ws).
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const P = require('./protocolo');
const filtro = require('./filtro');
const { asignar, estado } = require('./sala');

const PUERTO = parseInt(process.argv[2], 10) || 8080;
const RAIZ = path.join(__dirname, '..', 'game');
const NIVEL_INICIAL = 'level-0';

// ---------- estáticos (sin dependencias: mimetipos a mano) ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2',
};

const servidor = http.createServer((req, res) => {
  if (req.url === '/estado') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(estado()));
    return;
  }
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  // normaliza y encierra dentro de game/ (nada de ../)
  const ruta = path.normalize(path.join(RAIZ, url === '/' ? 'index.html' : url));
  if (!ruta.startsWith(RAIZ)) { res.writeHead(403); res.end(); return; }
  fs.readFile(ruta, (err, datos) => {
    if (err) { res.writeHead(404); res.end('no existe'); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(ruta).toLowerCase()] || 'application/octet-stream' });
    res.end(datos);
  });
});

// ---------- WebSocket ----------
const wss = new WebSocketServer({ server: servidor, path: '/ws' });
const porIp = new Map(); // ip -> nº de conexiones

wss.on('connection', (ws, req) => {
  // Detrás de Caddy todos llegan como 127.0.0.1: la IP real va en X-Forwarded-For.
  // En desarrollo (conexión loopback directa, sin cabecera) no se aplica el cap
  // — si no, los enjambres de bots de prueba se autobloquean.
  const directa = req.socket.remoteAddress || '?';
  const reenviada = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const esLocal = directa === '127.0.0.1' || directa === '::1' || directa === '::ffff:127.0.0.1';
  const ip = reenviada || directa;
  const n = (porIp.get(ip) || 0) + 1;
  if (n > P.CAP_POR_IP && !(esLocal && !reenviada)) { ws.close(1008, 'demasiadas conexiones'); return; }
  porIp.set(ip, n);

  let jug = null, sala = null;
  ws.vivo = true;
  ws.on('pong', () => { ws.vivo = true; });

  // sin presentarse en 5 s → fuera
  const timbre = setTimeout(() => { if (!jug) ws.close(1008, 'sin hola'); }, 5000);

  ws.on('message', (raw) => {
    const m = P.leer(raw);
    if (!m) return;
    if (m.t === 'hola') {
      if (jug) return; // ya presentado
      clearTimeout(timbre);
      sala = asignar(NIVEL_INICIAL);
      jug = sala.entrar(ws, filtro.nombreLimpio(m.nombre), m.token);
      console.log(`[+] ${jug.nombre}#${jug.id} → ${sala.clave} (${sala.jugadores.size})`);
      return;
    }
    if (!jug) return; // todo lo demás exige estar dentro
    if (m.t === 'mover') sala.mover(jug, m.dx, m.dy);
    else if (m.t === 'rot') sala.girar(jug, m.rot);
    else if (m.t === 'chat') {
      const txt = filtro.chatLimpio(m.txt);
      if (txt) sala.chat(jug, txt);
    } else if (m.t === 'ping') sala.enviar(ws, { t: 'pong' });
  });

  ws.on('close', () => {
    porIp.set(ip, (porIp.get(ip) || 1) - 1);
    if (porIp.get(ip) <= 0) porIp.delete(ip);
    if (jug && sala) {
      sala.salir(jug);
      console.log(`[-] ${jug.nombre}#${jug.id} ← ${sala.clave} (${sala.jugadores.size})`);
    }
  });
  ws.on('error', () => {});
});

// latido: conexiones muertas fuera cada 30 s
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.vivo) { ws.terminate(); continue; }
    ws.vivo = false;
    try { ws.ping(); } catch (e) {}
  }
}, 30000);

servidor.listen(PUERTO, () => {
  console.log(`BACKROOMS MMO en http://localhost:${PUERTO}  (ws en /ws)`);
});
