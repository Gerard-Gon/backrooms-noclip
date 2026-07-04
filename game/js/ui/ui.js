// Interfaz: pantallas, HUD, registro, dados, modales y diario.
(function () {
  const $ = (id) => document.getElementById(id);
  const world = Game.world;

  const screens = {
    title: $('screen-title'),
    card: $('screen-card'),
    game: $('screen-game'),
    end: $('screen-end'),
  };

  function show(name) {
    // fundido cosmético; el swap de display es SÍNCRONO (el selftest lo exige)
    const fade = $('fade');
    if (fade && !window.NOFX) {
      fade.style.opacity = '1';
      requestAnimationFrame(() => requestAnimationFrame(() => { fade.style.opacity = '0'; }));
    }
    for (const [k, el] of Object.entries(screens))
      el.style.display = k === name ? 'flex' : 'none';
    if (name === 'game') screens.game.style.display = 'flex';
    if (name === 'card') {
      // re-dispara la animación de entrada de la tarjeta
      const card = screens.card.querySelector('.level-card');
      if (card) { card.classList.remove('card-in'); void card.offsetWidth; card.classList.add('card-in'); }
    }
  }

  // ---------- registro ----------
  function log(msg, cls) {
    const logEl = $('game-log');
    const p = document.createElement('p');
    p.textContent = msg;
    if (cls) p.className = cls;
    logEl.prepend(p);
    while (logEl.children.length > 5) logEl.removeChild(logEl.lastChild);
  }

  // ---------- HUD (v15: limpio y contextual — manos + mochila, sin barras) ----------
  const ICONOS_INV = {
    agua_almendras: 'refresco', botiquin: 'botiquin', linterna: 'linterna',
    chaqueta: 'chaqueta', amuleto: 'cuadro', llave_nivel: 'llave',
    tuberia: 'tuberia', fuego_griego: 'fuego', guante_paralisis: 'guante',
    detector: 'antena', trebol: 'trebol',
  };

  function updateHUD() {
    if (!world.player || !world.level) return;
    $('hud-level').textContent = `${world.level.wikiTitle} · Peligro ${world.level.peligro}/5`;
    renderManos();
    if ($('backpack-panel').style.display !== 'none') renderBackpack();
  }

  function renderManos() {
    const manos = world.player.manos || [null, null];
    for (let m = 0; m < 2; m++) {
      const el = $('mano-' + m);
      el.innerHTML = '';
      el.classList.remove('activa');
      const id = manos[m];
      if (id === '=') {
        el.title = 'Ocupada por el objeto a dos manos';
        el.textContent = '·';
        continue;
      }
      if (id) {
        const def = world.data.objects[id];
        if (window.Icons) el.appendChild(Icons.img(ICONOS_INV[id] || 'interrogante', 24));
        el.title = `${def.nombre} (clic: guardar en la mochila)`;
        if (id === 'linterna' && world.player.luz) el.classList.add('activa');
      } else {
        el.title = (m === 0 ? 'Mano izquierda' : 'Mano derecha') + ' (vacía)';
      }
    }
  }

  function renderBackpack() {
    const cont = $('backpack-slots');
    cont.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot';
      const id = world.player.inv[i];
      const k = document.createElement('span');
      k.className = 'k'; k.textContent = i + 1;
      slot.appendChild(k);
      if (id) {
        const def = world.data.objects[id];
        const ic = ICONOS_INV[id] || 'interrogante';
        slot.appendChild(window.Icons ? Icons.img(ic, 24) : document.createTextNode('?'));
        slot.title = `${def.nombre} — ${def.descripcion}`;
        slot.draggable = true;
        slot.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', String(i)));
        slot.onclick = () => showItemInfo(i, ic);
      }
      cont.appendChild(slot);
    }
  }

  function backpackAbierta() { return $('backpack-panel').style.display !== 'none'; }
  function toggleBackpack(force) {
    const vis = force !== undefined ? force : !backpackAbierta();
    $('backpack-panel').style.display = vis ? 'flex' : 'none';
    if (vis) renderBackpack();
    if (window.Sfx) Sfx.play('ui');
    if (world.level && !world.over) {
      if (vis) world.busy = true;
      else if ($('exit-modal').style.display === 'none' &&
               $('dice-overlay').style.display === 'none' &&
               $('choice-modal').style.display === 'none' &&
               $('item-modal').style.display === 'none') world.busy = false;
    }
  }

  // manos: clic desequipa; soltar un objeto arrastrado desde la mochila equipa
  for (const m of [0, 1]) {
    const el = $('mano-' + m);
    el.onclick = () => Game.desequipar(m);
    el.addEventListener('dragover', (e) => e.preventDefault());
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      const s = e.dataTransfer.getData('text/plain');
      if (s !== '') Game.equipar(parseInt(s, 10));
    });
  }

  // ---------- ventana de información de objeto ----------
  function efectoLegible(def) {
    const e = def.efecto || {};
    const partes = [];
    if (e.salud) partes.push(`Restaura ${e.salud} ♥ de salud`);
    if (e.cordura) partes.push(`Restaura ${e.cordura} ☯ de cordura`);
    if (e.sed) partes.push(`Sacia ${e.sed} 💧 de sed`);
    if (e.toggle === 'luz') partes.push('Alterna la luz (+4 de visión; atrae Deathmoths)');
    if (e.activo === 'fuego') partes.push('USO ÚNICO: quema (−30) y ahuyenta todo en radio 3');
    if (e.activo === 'paralisis') partes.push('USO ÚNICO: paraliza 6 turnos a lo adyacente');
    if (e.pasivo === 'arma') partes.push('PASIVO: muévete HACIA una entidad adyacente para golpearla');
    if (e.pasivo === 'abrigo') partes.push('PASIVO: anula el daño por frío');
    if (e.pasivo === 'detector') partes.push('PASIVO: entidades cercanas visibles en el minimapa');
    if (e.pasivo === 'suerte') partes.push('PASIVO: +2 a todas tus tiradas de dado');
    if (e.pasivo === 'llave') partes.push('Se gasta al abrir una puerta de acero en The Hub');
    return partes.join(' · ') || 'Efecto desconocido.';
  }

  function showItemInfo(slot, icono) {
    const id = world.player.inv[slot];
    if (!id) return;
    const def = world.data.objects[id];
    world.busy = true;
    if (window.Sfx) Sfx.play('ui');
    const iconEl = $('item-icon');
    iconEl.textContent = '';
    if (window.Icons && Icons.has(icono)) iconEl.appendChild(Icons.img(icono, 20));
    else iconEl.textContent = icono;
    $('item-name').textContent = def.nombre;
    $('item-desc').textContent = def.descripcion;
    $('item-effect').textContent = efectoLegible(def);
    const wiki = $('item-wiki');
    if (def.url) { wiki.style.display = 'inline'; wiki.href = def.url; }
    else wiki.style.display = 'none';
    const usable = def.efecto && (def.efecto.salud || def.efecto.cordura || def.efecto.sed ||
      def.efecto.toggle || def.efecto.activo);
    const btnUse = $('btn-item-use');
    btnUse.style.display = usable ? 'inline-block' : 'none';
    btnUse.onclick = () => { cerrarItemInfo(); Game.useItem(slot); };
    const btnEq = $('btn-item-equip');
    btnEq.style.display = def.manos ? 'inline-block' : 'none';
    btnEq.onclick = () => { cerrarItemInfo(); Game.equipar(slot); };
    $('btn-item-close').onclick = cerrarItemInfo;
    $('item-modal').style.display = 'flex';
  }
  function cerrarItemInfo() {
    $('item-modal').style.display = 'none';
    if ($('exit-modal').style.display === 'none' && $('dice-overlay').style.display === 'none' &&
        $('choice-modal').style.display === 'none' && !backpackAbierta())
      world.busy = false;
  }

  let flashT = -99999;
  function flashDamage() { flashT = performance.now(); }

  // ---------- tarjeta de nivel ----------
  function showLevelCard(def, cb) {
    show('card');
    if (window.Sfx) { Sfx.play('ui'); Sfx.idle(true); } // pad suave entre niveles
    const colores = ['#3fae6a', '#8bb944', '#d9a531', '#e0742c', '#d94a35', '#a12744'];
    $('card-danger').style.background = colores[def.peligro] || '#888';
    $('card-name').textContent = def.nombre;
    $('card-class').textContent = `${def.clase} · Peligro ${def.peligro}/5 · ${def.bioma}`;
    $('card-desc').textContent = def.descripcion;
    $('card-quote').textContent = '«' + def.cita + '»';
    const rulesEl = $('card-rules');
    rulesEl.innerHTML = '';
    const chip = (icono, texto) => {
      const span = document.createElement('span');
      const id = window.Icons ? (Icons.has(icono) ? icono : Icons.deEmoji(icono)) : null;
      if (id) span.appendChild(Icons.img(id, 13));
      else if (icono) span.appendChild(document.createTextNode(icono));
      span.appendChild(document.createTextNode(' ' + texto));
      return span;
    };
    for (const rid of def.reglas || []) {
      const r = Rules.get(rid);
      if (!r) continue;
      const span = chip(r.icono, r.nombre);
      span.title = r.desc;
      rulesEl.appendChild(span);
    }
    if (def.esEscape) {
      const span = chip('estrella', 'POSIBLE RUTA DE ESCAPE');
      span.style.borderColor = '#4ade80';
      span.style.color = '#8ae8a0';
      rulesEl.appendChild(span);
    }
    $('card-wiki').href = def.url;
    $('btn-enter').onclick = () => {
      if (window.Sfx) Sfx.idle(false);
      show('game');
      cb();
    };
  }

  // ---------- dado ----------
  function showDice(texto, cb) {
    const ov = $('dice-overlay'), face = $('dice-face');
    $('dice-text').textContent = texto;
    ov.style.display = 'flex';
    face.classList.add('rolling');
    let ticks = 0;
    const iv = setInterval(() => {
      face.textContent = 1 + Math.floor(Math.random() * 20);
      if (++ticks > 14) {
        clearInterval(iv);
        const result = 1 + Math.floor(Math.random() * 20);
        face.textContent = result;
        face.classList.remove('rolling');
        setTimeout(() => { ov.style.display = 'none'; cb(result); }, 900);
      }
    }, 70);
  }

  // ---------- modal de salida ----------
  let exitDefShown = null;
  function showExitModal(def) {
    exitDefShown = def;
    world.busy = true;
    // colección: ver una salida la desbloquea en el códice (las de retorno no cuentan)
    if (def.tipo !== 'retorno' && world.level)
      Game.Profiles.registrarDescubierto('salidas', `${world.level.id}::${def.texto}`);
    $('exit-modal').style.display = 'flex';
    $('exit-text').textContent = def.texto;
    const warn = $('exit-warn');
    const destinoNombre = def.destino && world.data.levels[def.destino]
      ? world.data.levels[def.destino].wikiTitle : null;
    if (def.tipo === 'retorno')
      warn.textContent = `↩ Volver por donde viniste → ${destinoNombre ?? '???'}`;
    else if (def.tipo === 'escape') warn.textContent = '⭐ Parece un camino de vuelta a la realidad.';
    else if (def.tipo === 'sellada') warn.textContent = '⌀ El camino se pierde en niveles sin cartografiar.';
    else if (def.tipo === 'llave') warn.textContent = '🗝 Requiere una Llave de Nivel.';
    else if (def.tipo === 'arriesgada' && def.riesgoVoid > 0)
      warn.textContent = `⚠ Camino inestable (riesgo de caer al Vacío) → ${destinoNombre ?? '???'}`;
    else warn.textContent = destinoNombre ? `→ ${destinoNombre}` : '→ ¿?';
    $('btn-cross').onclick = () => { hideExitModal(); Game.crossExit(def); };
    $('btn-stay').onclick = hideExitModal;
  }
  function hideExitModal() {
    $('exit-modal').style.display = 'none';
    world.busy = false;
  }

  // ---------- selector de nivel (llave del Hub) ----------
  function showLevelPicker(ids, cb) {
    world.busy = true;
    const modal = $('exit-modal');
    modal.style.display = 'flex';
    $('exit-text').innerHTML = 'La Llave gira. ¿Qué puerta abres?<br><br>';
    const warn = $('exit-warn');
    warn.innerHTML = '';
    for (const id of ids) {
      const b = document.createElement('button');
      b.className = 'btn-small';
      b.style.margin = '3px';
      b.textContent = world.data.levels[id].wikiTitle;
      b.onclick = () => { modal.style.display = 'none'; world.busy = false; cb(id); };
      warn.appendChild(b);
    }
    $('btn-cross').onclick = null;
    $('btn-cross').style.display = 'none';
    $('btn-stay').onclick = () => {
      modal.style.display = 'none';
      $('btn-cross').style.display = '';
      world.busy = false;
    };
  }

  // ---------- elección libre (beber agua, rituales…) ----------
  function showChoice(titulo, texto, opciones) {
    world.busy = true;
    $('choice-title').textContent = titulo;
    $('choice-text').textContent = texto;
    const btns = $('choice-btns');
    btns.innerHTML = '';
    opciones.forEach((op, i) => {
      const b = document.createElement('button');
      b.className = i === 0 ? 'btn-big' : 'btn-small';
      if (i === 0) { b.style.fontSize = '12px'; b.style.padding = '11px 20px'; }
      b.textContent = op.label;
      b.onclick = () => {
        $('choice-modal').style.display = 'none';
        if ($('exit-modal').style.display === 'none' && $('dice-overlay').style.display === 'none')
          world.busy = false;
        if (window.Sfx) Sfx.play('ui');
        if (op.cb) op.cb();
      };
      btns.appendChild(b);
    });
    $('choice-modal').style.display = 'flex';
  }

  // ---------- diario ----------
  function renderJournal(listEl) {
    listEl.innerHTML = '';
    for (const j of world.journal) {
      const li = document.createElement('li');
      li.textContent = `${j.nombre} (${j.turnos} turnos) — ${j.salida}`;
      listEl.appendChild(li);
    }
    if (world.level && !world.over) {
      const li = document.createElement('li');
      li.textContent = `${world.level.wikiTitle} (${world.turn} turnos) — estás aquí`;
      li.style.color = '#d9c66e';
      listEl.appendChild(li);
    }
  }
  function toggleJournal() {
    const p = $('journal-panel');
    const visible = p.style.display !== 'none';
    p.style.display = visible ? 'none' : 'block';
    if (!visible) renderJournal($('journal-list'));
  }

  // ---------- códice del errante ----------
  function renderCodex() {
    const P = Game.Profiles;
    const perfil = P.get();
    $('codex-name').textContent = P.activeName() || 'sin perfil';
    const recEl = $('codex-records'), lvEl = $('codex-levels'), hiEl = $('codex-history');
    lvEl.innerHTML = ''; hiEl.innerHTML = '';
    if (!perfil) { recEl.textContent = 'Crea un perfil para empezar tu expediente.'; return; }
    const r = perfil.records;
    recEl.textContent = `Expediciones: ${r.runs} · Récord de niveles en una expedición: ${r.maxNiveles} · Récord de turnos sobrevividos: ${r.maxTurnos} · Escapes logrados: ${r.escapes}`;
    const colores = ['#3fae6a', '#8bb944', '#d9a531', '#e0742c', '#d94a35', '#a12744'];
    const entries = Object.entries(perfil.codice).sort((a, b) => b[1].veces - a[1].veces);
    if (!entries.length) lvEl.innerHTML = '<p class="codex-records">Aún no has transitado ningún nivel.</p>';
    for (const [id, c] of entries) {
      const lv = world.data.levels[id];
      if (!lv) continue;
      const div = document.createElement('div');
      div.className = 'codex-level';
      div.style.borderLeftColor = colores[lv.peligro] || '#888';
      const mejor = c.mejorTurnos !== null
        ? ` · mejor travesía: ${c.mejorTurnos} turnos` : ' · nunca lograste salir de él';
      div.innerHTML = `<h4>${lv.nombre}${c.escapado ? ' ⭐' : ''}</h4>
        <div class="meta">${lv.clase} · Peligro ${lv.peligro}/5 · bioma: ${lv.bioma}</div>
        <div class="desc">${lv.descripcion}</div>
        <div class="stats">Transitado ${c.veces} ${c.veces === 1 ? 'vez' : 'veces'}${mejor}${c.escapado ? ' · ⭐ escapaste por aquí' : ''}</div>
        <a href="${lv.url}" target="_blank" rel="noopener">ficha original en la wiki ↗</a>`;
      lvEl.appendChild(div);
    }
    for (const h of perfil.historial || []) {
      const li = document.createElement('li');
      li.textContent = `${h.fecha} · semilla «${h.semilla}» · ${h.niveles} niveles, ${h.turnos} turnos · ${h.resultado}`;
      hiEl.appendChild(li);
    }
    renderColeccion(perfil);
  }

  // ---------- Colección (v15): coleccionables con «???» hasta descubrirlos ----------
  function silueta(glyph) {
    const spr = Sprites.get(glyph, 0);
    if (!spr) return null;
    const c = document.createElement('canvas');
    c.width = spr.width; c.height = spr.height;
    const x = c.getContext('2d');
    x.drawImage(spr, 0, 0);
    x.globalCompositeOperation = 'source-in';   // solo tiñe los píxeles del sprite
    x.fillStyle = '#15130e';
    x.fillRect(0, 0, c.width, c.height);
    return c.toDataURL();
  }

  function renderColeccion(perfil) {
    const desc = perfil.descubiertos || { salidas: {}, entidades: {}, objetos: {} };

    // entidades: sprite real si la has visto; silueta negra y ??? si no
    const entEl = $('codex-entidades');
    entEl.innerHTML = '';
    let vistas = 0;
    const ents = Object.values(world.data.entities);
    for (const def of ents) {
      const visto = !!desc.entidades[def.id];
      if (visto) vistas++;
      const card = document.createElement('div');
      card.className = 'col-card' + (visto ? '' : ' col-locked');
      const spr = visto ? Sprites.get(def.glyph, 0) : null;
      const img = document.createElement('img');
      img.className = 'icono';
      img.style.width = img.style.height = '40px';
      img.src = spr ? spr.toDataURL() : (silueta(def.glyph) || (window.Icons ? Icons.url('interrogante') : ''));
      card.appendChild(img);
      const nom = document.createElement('div');
      nom.textContent = visto ? def.nombre : '???';
      card.appendChild(nom);
      if (visto) card.title = def.descripcion || def.nombre;
      entEl.appendChild(card);
    }
    entEl.insertAdjacentHTML('afterbegin',
      `<p class="col-cuenta">${vistas}/${ents.length} avistadas</p>`);

    // objetos
    const objEl = $('codex-objetos');
    objEl.innerHTML = '';
    let habidos = 0;
    const objs = Object.values(world.data.objects);
    for (const def of objs) {
      const visto = !!desc.objetos[def.id];
      if (visto) habidos++;
      const card = document.createElement('div');
      card.className = 'col-card' + (visto ? '' : ' col-locked');
      if (window.Icons)
        card.appendChild(Icons.img(visto ? (ICONOS_INV[def.id] || 'interrogante') : 'interrogante', 32));
      const nom = document.createElement('div');
      nom.textContent = visto ? def.nombre : '???';
      card.appendChild(nom);
      if (visto) card.title = def.descripcion || def.nombre;
      objEl.appendChild(card);
    }
    objEl.insertAdjacentHTML('afterbegin',
      `<p class="col-cuenta">${habidos}/${objs.length} conseguidos</p>`);

    // salidas por nivel (solo niveles que ya pisaste: sin spoilers del resto)
    const salEl = $('codex-salidas');
    salEl.innerHTML = '';
    for (const id of Object.keys(perfil.codice)) {
      const lv = world.data.levels[id];
      if (!lv || !(lv.salidas || []).length) continue;
      const halladas = lv.salidas.filter((s) => desc.salidas[`${id}::${s.texto}`]);
      const div = document.createElement('div');
      div.className = 'col-nivel';
      const ul = lv.salidas.map((s) =>
        desc.salidas[`${id}::${s.texto}`]
          ? `<li>${s.texto}</li>`
          : '<li class="col-locked">??? — sin descubrir</li>').join('');
      div.innerHTML = `<b>${lv.wikiTitle}</b> <span class="col-cuenta">salidas ${halladas.length}/${lv.salidas.length}</span><ul>${ul}</ul>`;
      salEl.appendChild(div);
    }
    if (!salEl.children.length)
      salEl.innerHTML = '<p class="codex-records">Explora niveles para catalogar sus salidas.</p>';
  }

  let codexVisible = false;
  function toggleCodex(force) {
    codexVisible = force !== undefined ? force : !codexVisible;
    $('codex-panel').style.display = codexVisible ? 'flex' : 'none';
    if (codexVisible) renderCodex();
    // pausa el juego mientras el códice está abierto (sin pisar modales/dado)
    if (world.level && !world.over) {
      if (codexVisible) world.busy = true;
      else if ($('exit-modal').style.display === 'none' && $('dice-overlay').style.display === 'none')
        world.busy = false;
    }
  }
  $('btn-codex-close').onclick = () => toggleCodex(false);

  // ---------- fin ----------
  function showEnd(victoria, causa) {
    show('end');
    if (window.Sfx) setTimeout(() => Sfx.idle(true, victoria ? 'victoria' : 'muerte'), 1600);
    const t = $('end-title');
    t.textContent = victoria ? 'HAS ESCAPADO' : 'FIN DEL TRAYECTO';
    t.className = victoria ? 'victoria' : 'muerte';
    $('end-cause').textContent = causa;
    $('end-stats').innerHTML = `
      <div><b>${world.journal.length}</b>niveles</div>
      <div><b>${world.turnTotal}</b>turnos</div>
      <div><b>${world.runSeed}</b>semilla</div>`;
    renderJournal($('end-journal'));
  }

  world.ui = {
    log, updateHUD, flashDamage, showLevelCard, showDice,
    showExitModal, showLevelPicker, showChoice, toggleJournal, showEnd, show, toggleCodex,
    toggleBackpack,
    get flashT() { return flashT; },
  };
})();
