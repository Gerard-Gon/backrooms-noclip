// Una SALA = una instancia viva de un nivel («level-0::1»). Mantiene el censo
// de jugadores, valida movimientos contra el mapa real y difunde los eventos.
// Los jugadores NO se bloquean entre sí (60 personas en un pasillo = griefing
// gratis si colisionaran); las entidades (M2) sí tendrán colisión propia.
'use strict';

const { generarMapa, esTransitable } = require('./sim/mundo');
const P = require('./protocolo');

let siguienteId = 1;

class Sala {
  constructor(nivelId, inst) {
    this.nivelId = nivelId;
    this.inst = inst;
    this.clave = `${nivelId}::${inst}`;
    // La semilla es el contrato con el cliente: mismo string → mismo mapa.
    this.semilla = `mmo::${nivelId}::${inst}`;
    const { def, map } = generarMapa(nivelId, this.semilla);
    this.def = def;
    this.map = map;
    this.jugadores = new Map();
  }

  get llena() { return this.jugadores.size >= P.CAP_SALA; }

  ocupada(x, y) {
    for (const j of this.jugadores.values()) if (j.x === x && j.y === y) return true;
    return false;
  }

  // Casilla libre más cercana al spawn del mapa (anillos crecientes).
  buscarSpawn() {
    const [sx, sy] = this.map.spawn;
    for (let r = 0; r < 20; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = sx + dx, y = sy + dy;
          if (esTransitable(this.map, x, y) && !this.ocupada(x, y)) return [x, y];
        }
    return [sx, sy]; // sala a reventar: se apilan (mejor que rechazar)
  }

  censo() {
    return [...this.jugadores.values()].map((j) => ({
      id: j.id, nombre: j.nombre, x: j.x, y: j.y, rot: j.rot,
    }));
  }

  entrar(ws, nombre, token) {
    const id = siguienteId++;
    const [x, y] = this.buscarSpawn();
    const jug = { id, ws, nombre, token, x, y, rot: 2, ultMov: 0, ultChat: 0 };
    this.enviar(ws, {
      t: 'bienvenida', id, nivel: this.nivelId, inst: this.inst,
      semilla: this.semilla, x, y, rot: jug.rot, jugadores: this.censo(),
    });
    this.difundir({ t: 'entra', id, nombre, x, y, rot: jug.rot });
    this.jugadores.set(id, jug);
    return jug;
  }

  salir(jug) {
    if (!this.jugadores.delete(jug.id)) return;
    this.difundir({ t: 'sale', id: jug.id });
  }

  mover(jug, dx, dy) {
    const ahora = Date.now();
    // input demasiado rápido: se ignora en silencio (el cliente ya predice)
    if (ahora - jug.ultMov < P.COOLDOWN_MOVER) return;
    const nx = jug.x + dx, ny = jug.y + dy;
    if (esTransitable(this.map, nx, ny)) {
      jug.x = nx; jug.y = ny; jug.ultMov = ahora;
      this.difundir({ t: 'mueve', id: jug.id, x: nx, y: ny });
    } else {
      // paso ilegal (muro/borde): solo el autor recibe la corrección
      this.enviar(jug.ws, { t: 'mueve', id: jug.id, x: jug.x, y: jug.y });
    }
  }

  girar(jug, rot) {
    if (jug.rot === rot) return;
    jug.rot = rot;
    this.difundir({ t: 'gira', id: jug.id, rot }, jug.id);
  }

  chat(jug, txt) {
    const ahora = Date.now();
    if (ahora - jug.ultChat < P.COOLDOWN_CHAT) {
      this.enviar(jug.ws, { t: 'aviso', txt: 'Más despacio: un mensaje cada segundo y medio.' });
      return;
    }
    jug.ultChat = ahora;
    // el emisor también lo recibe: su bocadillo sale del eco del servidor
    this.difundir({ t: 'chat', id: jug.id, txt });
  }

  enviar(ws, msg) {
    if (ws.readyState === 1) ws.send(JSON.stringify(msg));
  }

  difundir(msg, exceptoId) {
    const raw = JSON.stringify(msg);
    for (const j of this.jugadores.values())
      if (j.id !== exceptoId && j.ws.readyState === 1) j.ws.send(raw);
  }
}

// ---------- registro de salas: nivel → instancias con desbordamiento ----------
const salas = new Map(); // clave -> Sala

function asignar(nivelId) {
  let inst = 1;
  for (;;) {
    const clave = `${nivelId}::${inst}`;
    let sala = salas.get(clave);
    if (!sala) {
      sala = new Sala(nivelId, inst);
      salas.set(clave, sala);
      console.log(`[sala] abierta ${clave} (${sala.map.grid.w}×${sala.map.grid.h})`);
    }
    if (!sala.llena) return sala;
    inst++;
  }
}

function estado() {
  return {
    salas: [...salas.values()].map((s) => ({ clave: s.clave, jugadores: s.jugadores.size })),
    total: [...salas.values()].reduce((n, s) => n + s.jugadores.size, 0),
  };
}

module.exports = { Sala, asignar, estado };
