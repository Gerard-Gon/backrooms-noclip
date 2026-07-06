// Puente Node ↔ motor del juego: carga los MISMOS módulos que el navegador
// (patrón de pipeline/level0-audit.js). El servidor genera mapas idénticos a
// los del cliente a partir de la misma semilla — por la red nunca viaja un mapa.
'use strict';

global.window = global;
require('../../game/js/data.js');        // window.GAME_DATA (niveles/entidades/objetos)
require('../../game/js/engine/rng.js');  // window.RNG (mulberry32 determinista)
require('../../game/js/mapgen/mapgen.js'); // window.MapGen (generate/walkable/bfsDist)

const DATA = global.GAME_DATA;
const RNG = global.RNG;
const MapGen = global.MapGen;

// Genera el mapa de una sala. La semilla es el contrato con el cliente:
// mismo string → mismo mapa en servidor y navegador.
function generarMapa(nivelId, semilla) {
  const def = DATA.levels[nivelId];
  if (!def) throw new Error(`nivel desconocido: ${nivelId}`);
  const map = MapGen.generate(def, RNG.create(semilla));
  return { def, map };
}

function esTransitable(map, x, y) {
  if (x < 0 || y < 0 || x >= map.grid.w || y >= map.grid.h) return false;
  return MapGen.walkable(MapGen.at(map.grid, x, y));
}

module.exports = { DATA, RNG, MapGen, generarMapa, esTransitable };
