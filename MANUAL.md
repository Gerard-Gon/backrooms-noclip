# 📖 MANUAL DEL JUEGO — Backrooms: No-Clip

Guía de todo lo que puedes hacer/modificar tú mismo, sin programar.
*(Este archivo se mantiene actualizado con cada versión del juego.)*

---

## 1. Jugar

**Doble clic en `game/index.html`.** Nada que instalar. Funciona sin internet.

El juego se renderiza en **3D real en TERCERA PERSONA** (motor Three.js incluido): la cámara
va pegada a la espalda del errante, los niveles interiores tienen **techo real con
fluorescentes**, bloom cinematográfico y polvo en suspensión. Alternativas por URL:
`?cam=alta` (cámara cenital estilo Octopath de versiones anteriores), `?render=2d` (vista
2D clásica), `?nofx=1` (sin efectos, por si va lento).

| Tecla | Acción |
|---|---|
| W / ↑ | Avanzar un paso hacia donde miras (1 paso = 1 turno) |
| S / ↓ | Retroceder un paso (sin girarte) |
| A / D (o Q / E) | Girarte 90° a izquierda/derecha — girar es GRATIS, no gasta turno |
| ESPACIO | Interactuar: salidas, muebles registrables, **beber agua**… |
| X | Esperar un turno |
| F | Linterna (debe estar EN UNA MANO): cono de luz real (¡atrae a las Deathmoths!) |
| B | Abrir/cerrar la **mochila** |
| M (o N) | Ver el mapa de lo explorado |
| J | Diario de ruta de la partida |
| C | Códice del Errante (expediente y colección) |
| 1-6 | Usar objeto de la mochila |

*(La lista de controles vive también en el menú de ajustes ⚙, junto al volumen.)*

- **Objetivo**: encontrar una de las rarísimas rutas de escape (⭐). La muerte es permanente.
- **HUD contextual**: no hay barras de vida ni contador de turnos. Tu personaje **piensa en
  bocadillos** («Tengo la garganta seca…», «Estoy malherido…») y su propio sprite se ve
  ensangrentado cuando está grave. Los estados los llevas TÚ en la cabeza, como él.
- **Volver atrás**: ya no hay tecla mágica. La única manera de regresar es **la puerta por la
  que llegaste** (queda marcada donde apareces) — y cada nivel se conserva TAL CUAL lo
  dejaste. Excepción: si CAÍSTE (agujero, trampilla, vacío), no hay vuelta: nadie escala eso.
- **Manos y mochila**: dos ranuras de mano (abajo a la derecha) + mochila de 6 huecos (`B`).
  La linterna y las armas solo funcionan **empuñadas**: arrastra el objeto a una mano (o
  botón EMPUÑAR en su ficha). Clic en una mano la guarda de vuelta. Los pasivos (chaqueta,
  trébol, detector…) funcionan con solo llevarlos encima.
- **Interacciones libres**: si hay agua, PUEDES bebértela (ESPACIO)… la wiki decide si era
  buena idea. Este patrón irá creciendo: el juego te deja hacer, el lore responde.
- El **mapa** (`M`) dibuja solo lo explorado y lo conserva; si el nivel se reorganiza
  (Level 0, 27…) lo oirás como un derrumbe y esa zona vuelve a quedar sin cartografiar.
- **Salidas rituales**: algunas salidas no son puertas — son el objeto exacto que dice la wiki
  (la nave de juguete de Level 483, el reloj digital de Level 80…). Todas las salidas
  documentadas de cada nivel están en el juego (las de fuera del piloto, grises/selladas).

### Combate y defensa

- **Tubería oxidada** 🔧: mientras la lleves, **muévete HACIA una entidad adyacente para
  golpearla** (daño + retroceso). Ojo: golpear al Silver Slime te salpica ácido.
- **Fuego griego** 🔥 (Object 5): úsalo (tecla de su ranura) → quema y ahuyenta todo en radio 3. Un uso.
- **Guante de parálisis** 🧤 (Object 69): úsalo → inmoviliza 6 turnos a lo adyacente. Un uso.
- **Detector de entidades** 📡 (Object 30): pasivo → entidades cercanas en el minimapa.
- **Trébol de la suerte** 🍀 (Object 13): pasivo → +2 a todas tus tiradas de dado.
- Matar entidades cuesta un poco de cordura: en las Backrooms nada sale gratis.

## 2. Semillas (partidas compartibles)

En la pantalla de título puedes escribir una **semilla** (ej. `moqueta-777`). La misma semilla
genera exactamente los mismos mapas. Ideal para que tu chat juegue tu misma partida.

## 3. Perfiles y Códice

- Crea tu perfil en el título (puedes tener varios: uno por serie, uno para el chat…).
- El **Códice** (tecla `C`) guarda para siempre: niveles transitados con su descripción,
  veces visitado, mejor marca de turnos, escapes y tu historial de expediciones.
- **Colección** (dentro del códice): TODAS las entidades, objetos y salidas de cada nivel
  aparecen como coleccionables tapados con «???» (las entidades, como siluetas negras)
  hasta que los descubres jugando: ver una salida la desbloquea, avistar una entidad la
  revela, recoger un objeto lo cataloga. Ideal para completistas del stream.
- **Exportar** descarga tu perfil como archivo JSON (guárdalo como copia de seguridad).
- **Importar** lo restaura en otro navegador u ordenador.
- ⚠️ Los perfiles viven en el navegador: si borras los datos de navegación, se pierden
  (por eso conviene exportar de vez en cuando).

## 4. Para el directo (OBS)

- Captura la ventana del navegador como cualquier fuente de ventana.
- **Arranque rápido por URL** (útil como acceso directo del stream):
  - `index.html?seed=misemilla` — semilla precargada
  - `index.html?seed=misemilla&autostart=1` — entra directo a jugar, sin menús
- El texto del juego es grande y de alto contraste a propósito para que se lea en stream.

## 5. Poner tus propios sprites (dibujos de personajes/monstruos)

1. Crea un PNG con **fondo transparente**.
2. Tamaño: **48×48 píxeles por frame**. Si quieres animación de 2 frames: imagen de **96×48**
   (los dos frames en horizontal). Puedes poner más frames: 144×48 = 3, etc.
3. Guárdalo en `game/assets/sprites/` con el nombre exacto del personaje:
   `hound.png`, `faceling.png`, `player_down.png`… (lista completa en el `LEEME.txt` de esa carpeta).
4. Recarga el juego (F5). Si el PNG existe, se usa; si lo borras, vuelve el pixel-art integrado.

**¿Tienes una imagen que NO cumple el formato?** (otro tamaño, sin frames, con fondo…)
→ Déjala en cualquier carpeta del proyecto y dile a Claude *«convierte esta imagen en el sprite
de X»*. Claude la recorta, la escala a 48×48, le monta la hoja de frames y la deja lista.

## 5a. Fuentes de la interfaz

La UI usa dos fuentes pixel incluidas en `game/assets/fonts/` (**Press Start 2P** para
títulos y **VT323** para el texto; ambas con licencia libre OFL, incluida en esa carpeta).
Si algún día quieres otra fuente, basta con reemplazar el archivo `.ttf` por otro con el
mismo nombre y recargar. Los iconos del HUD son pixel-art generado por el propio juego.

## 5b. Sonidos

Todo el sonido del juego (pasos, golpes, dados, ambientes…) está **sintetizado por código**:
no necesitas hacer nada para que suene. Tecla `M` para silenciar.

- **Volumen**: slider 🔊 en el HUD y **menú de ajustes ⚙** (junto al slider, o botón en el título)
  con tres canales separados: **General**, **Efectos** y **Ambiente/música**. Todo se recuerda.
- Al pasar de nivel (tarjeta de presentación) el ambiente se detiene y suena un pad suave.
- **Sustituir un efecto**: pon un `.mp3`/`.ogg`/`.wav` en `game/assets/sounds/` con el nombre
  del efecto (`golpe.mp3`, `paso.mp3`…). Lista completa en el `LEEME.txt` de esa carpeta.
- **Ambientes por nivel**: guarda un archivo como `game/assets/sounds/niveles/level-X.mp3`
  y el juego lo usa automáticamente, **sin ejecutar nada**. Ejemplo: para tener el zumbido
  original de las Backrooms en Level 0, guarda tu audio favorito como `niveles/level-0.mp3`.
  Los de **Level 306, 385 y 777 son los audios reales de sus páginas de la wiki** (ya incluidos).
  Cada nivel sin archivo usa su ambiente sintetizado propio (relojes en Level 80, caja de
  música en la feria del 995, susurros en el asilo del 16, goteo en las tuberías del 2…).
- Si el navegador arranca en silencio: toca cualquier tecla o clic (política de autoplay).

## 6. Editar el contenido del juego (niveles, entidades, objetos)

Las "fichas" del juego son archivos de texto editables en `data/game/`:

- `levels.es.json` — los 30 niveles: descripción, peligro, colores, reglas, entidades, salidas…
- `entities.es.json` — las entidades: daño, velocidad, comportamiento, cómo evitarlas…
- `objects.es.json` — los objetos: qué curan, descripción…

Puedes editarlos con cualquier editor de texto (o pedírselo a Claude). **Después de editar,
ejecuta SIEMPRE** (en una terminal, dentro de la carpeta del proyecto):

```
node pipeline/build-data.js
```

Sin ese paso el juego no ve los cambios. Luego F5 en el navegador.

**Ideas de ajustes fáciles a mano:**
- Subir/bajar el `peligro` de un nivel o el `dano` de una entidad.
- Cambiar la `paleta` (colores) de un nivel: son códigos de color tipo `#7a6b3d`.
- Cambiar `vision` u `oscuridad` (0 = iluminado, 1 = negro total) de un nivel.
- Reescribir descripciones o citas a tu gusto.

## 7. Añadir un nivel nuevo de la wiki

Lo más cómodo: decirle a Claude *«añade el Level X de la wiki»* — la wiki entera ya está
descargada en `data/raw/` (no gasta internet ni tokens releerla) y el grafo completo de 734
niveles parseado en `data/parsed/levels.json`. Claude crea la ficha en español y conecta salidas.

Si quieres hacerlo tú: copia una ficha similar en `levels.es.json`, cámbiale `id`, textos,
`bioma` (uno de: pasillos, garaje, tuneles, hospital, oficinas, exterior, bosque, ciudad, torres),
paleta y salidas (los `destino` deben ser ids que existan), y ejecuta `build-data.js`.

## 8. El mapa de niveles (para ti, no para el juego)

`data/game/mapa-piloto.html` — diagrama con flechas de qué nivel lleva a cuál, coloreado por
peligro y con la ruta de escape marcada. Se regenera con: `node pipeline/make-map.js`

## 9. Actualizar la copia local de la wiki

La wiki completa (1.113 páginas) está en `data/raw/`. Si algún día quieres refrescarla con
páginas nuevas: `node pipeline/download.js` (solo descarga lo que falte).

## 10. Copias de seguridad del proyecto

El proyecto usa git (historial de versiones automático que gestiona Claude). Para una copia
de seguridad simple: copia la carpeta entera `Proyect Backrooms` a un disco externo.
Tu progreso de jugador NO está en la carpeta: expórtalo desde el botón **Exportar** del título.

## 11. Si algo falla

- Pulsa **F12** en el navegador → pestaña «Consola» → haz captura de los mensajes en rojo
  y enséñasela a Claude.
- `index.html?nofx=1` desactiva los efectos visuales (por si algo va lento).
- Borrar una partida guardada corrupta: botón «Borrar» del perfil (crea uno nuevo después).
