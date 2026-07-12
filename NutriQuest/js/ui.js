/* =========================================================
   NutriQuest — ui.js
   Rendering for HUD, world map, level-flow screens,
   encyclopedia, achievements, modals and toasts.
   ========================================================= */

const PET_EMOJI = { perro: '🐶', gato: '🐱', bovino: '🐄', equino: '🐴', ovino: '🐑', cabra: '🐐', ave: '🐔', cerdo: '🐖', microbiota: '🦠' };
const OUTFIT_EMOJI = { bata: '🥼', uniforme: '🩺', investigador: '🔬', ganadero: '🤠', nutricionista: '🥗' };

// Normalización para búsqueda/filtros (necesaria también en Enciclopedia).
// `minigames.js` expone `window.nqNormalize` como una función global (`function
// nqNormalize(){}`). IMPORTANTE: no la redeclaramos aquí con `const`/`let` a
// nivel superior — como todos los .js del proyecto se cargan como <script>
// clásicos (sin módulos), TODOS comparten el mismo scope global, y una
// redeclaración con `const` de un nombre ya definido con `function` en otro
// script lanza `SyntaxError: Identifier 'nqNormalize' has already been
// declared`, lo cual rompe la carga de ESTE archivo completo (¡y por lo tanto
// UIManager nunca se define!). Usamos un nombre distinto y resolvemos en
// cada llamada para no depender del orden exacto de carga.
function nqNormalizeFallback(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
function nqNormalizeUI(s) {
  const fn = (typeof window !== 'undefined' && typeof window.nqNormalize === 'function')
    ? window.nqNormalize
    : nqNormalizeFallback;
  return fn(s);
}

class UIManager {
  constructor(audio) {
    this.audio = audio;
  }

  /* ---------------- HUD ---------------- */
  renderHUD(hudEl, player, playerName) {
    hudEl.innerHTML = '';
    const avatar = document.createElement('div');
    avatar.className = 'hud-avatar';
    const petEmoji = player.state.equippedPet ? PET_EMOJI[player.state.equippedPet] : null;
    const outfitEmoji = player.state.equippedOutfit ? OUTFIT_EMOJI[player.state.equippedOutfit] : '🧑‍🎓';
    avatar.textContent = petEmoji || outfitEmoji;
    hudEl.appendChild(avatar);

    const identity = document.createElement('div');
    identity.className = 'hud-identity';
    const nameEl = document.createElement('div');
    nameEl.className = 'hud-name';
    nameEl.textContent = playerName || 'Aprendiz';
    const lvlEl = document.createElement('div');
    lvlEl.className = 'hud-level';
    lvlEl.textContent = `Nivel ${player.level}`;
    identity.appendChild(nameEl); identity.appendChild(lvlEl);
    hudEl.appendChild(identity);

    const track = document.createElement('div');
    track.className = 'hud-xp-track';
    const fill = document.createElement('div');
    fill.className = 'hud-xp-fill';
    fill.id = 'hud-xp-fill';
    const prog = player.xpProgress();
    fill.style.width = prog.pct + '%';
    track.appendChild(fill);
    hudEl.appendChild(track);

    const coins = document.createElement('div');
    coins.className = 'hud-coins';
    coins.id = 'hud-coins';
    coins.textContent = `🪙 ${player.coins}`;
    hudEl.appendChild(coins);

    const soundBtn = document.createElement('button');
    soundBtn.className = 'hud-menu-btn sound-toggle';
    soundBtn.id = 'hud-sound-toggle';
    hudEl.appendChild(soundBtn);

    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'hud-menu-btn';
    settingsBtn.id = 'hud-settings-btn';
    settingsBtn.textContent = '⚙️';
    hudEl.appendChild(settingsBtn);
  }

  flashXPBar() {
    const fill = document.getElementById('hud-xp-fill');
    if (fill) { fill.classList.add('level-up-flash'); setTimeout(() => fill.classList.remove('level-up-flash'), 1700); }
  }

  /* ---------------- Footer nav ---------------- */
  renderFooterNav(navEl, active, onNavigate) {
    navEl.innerHTML = '';
    const items = [
      { key: 'map', label: '🗺️ Mapa' },
      { key: 'shop', label: '🏪 Tienda' },
      { key: 'encyclopedia', label: '📖 Enciclopedia' },
      { key: 'leaderboard', label: '🏆 Puntuaciones' },
      { key: 'achievements', label: '🎖️ Logros' }
    ];
    items.forEach(it => {
      const b = document.createElement('button');
      b.className = 'nav-btn' + (active === it.key ? ' active' : '');
      b.textContent = it.label;
      b.onclick = () => onNavigate(it.key);
      navEl.appendChild(b);
    });
  }

  /* ---------------- Toasts ---------------- */
  toast(message, ms = 2600) {
    let stack = document.getElementById('toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'toast-stack';
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    stack.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  floatingCoinBurst(originEl, count = 5) {
    const rect = originEl ? originEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
    for (let i = 0; i < count; i++) {
      const c = document.createElement('div');
      c.className = 'floating-coin';
      c.textContent = '🪙';
      c.style.left = (rect.left + Math.random() * 30) + 'px';
      c.style.top = (rect.top + Math.random() * 10) + 'px';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 1100);
    }
  }

  particleBurst(container) {
    const rect = container.getBoundingClientRect();
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 60;
      p.style.setProperty('--px', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--py', Math.sin(angle) * dist + 'px');
      p.style.left = (rect.width / 2) + 'px';
      p.style.top = (rect.height / 2) + 'px';
      p.style.background = ['#D4A24C', '#729B4A', '#7FA8C9'][i % 3];
      container.appendChild(p);
      setTimeout(() => p.remove(), 950);
    }
  }

  /* ---------------- World Map ---------------- */
  renderMap(container, { levelManager, player, onSelectWorld }) {
    container.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'panel screen-enter map-wrap';

    const prog = levelManager.totalProgress(player);
    panel.innerHTML = `<h2 class="screen-title">🗺️ El Reino de los Nutrientes</h2>
      <p class="screen-subtitle">${prog.done}/${prog.total} pergaminos recuperados</p>`;

    const grid = document.createElement('div');
    grid.className = 'world-grid';

    levelManager.worlds.forEach(world => {
      const unlocked = levelManager.isWorldUnlocked(world.id, player);
      const stars = levelManager.worldStars(world.id, player);
      const node = document.createElement('div');
      node.className = 'world-node' + (unlocked ? '' : ' locked');
      node.style.setProperty('--wa', world.colorA);
      node.style.setProperty('--wb', world.colorB);
      node.innerHTML = unlocked
        ? `<div class="w-emoji">${world.emoji}</div>
           <div class="w-name">Mundo ${world.id}<br>${world.nombre}</div>
           <div class="w-stars">⭐ ${stars.total}/${stars.max}</div>`
        : `<div class="lock-icon">🔒</div>
           <div class="w-name">Mundo ${world.id}<br>${world.nombre}</div>`;
      if (unlocked) node.onclick = () => { this.audio.navigate(); onSelectWorld(world.id); };
      grid.appendChild(node);
    });

    panel.appendChild(grid);
    container.appendChild(panel);
  }

  renderWorldLevels(container, { world, levelManager, player, onSelectLevel, onBack }) {
    container.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'panel screen-enter map-wrap';
    panel.innerHTML = `<h2 class="screen-title">${world.emoji} Mundo ${world.id}: ${world.nombre}</h2>
      <p class="screen-subtitle">Elige un pergamino para comenzar</p>`;

    const path = document.createElement('div');
    path.className = 'level-path';

    world.levels.forEach((term, idx) => {
      const unlocked = levelManager.isLevelUnlocked(term, player);
      const result = player.state.completedLevels[term.id];
      const node = document.createElement('div');
      node.className = 'level-node' + (unlocked ? '' : ' locked') + (result ? ' done' : '');
      node.innerHTML = unlocked
        ? `<div class="lv-emoji">${term.icono}</div><div class="lv-stars">${result ? '⭐'.repeat(result.stars) : world.id + '-' + term.nivel}</div>`
        : `<div class="lv-emoji">🔒</div>`;
      if (unlocked) node.onclick = () => { this.audio.navigate(); onSelectLevel(term); };
      path.appendChild(node);
    });

    panel.appendChild(path);

    const back = document.createElement('div');
    back.className = 'btn-row';
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-outline';
    backBtn.textContent = '← Volver al mapa';
    backBtn.onclick = onBack;
    back.appendChild(backBtn);
    panel.appendChild(back);

    container.appendChild(panel);
  }

  /* ---------------- Level flow: Intro ---------------- */
  renderLevelIntro(container, term, world, onContinue) {
    container.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'panel screen-enter flow-card';
    panel.innerHTML = `
      <div class="concept-tag">${world.emoji} ${world.nombre} · Nivel ${world.id}-${term.nivel}</div>
      <div class="concept-icon-lg anim-zoom-in">${term.icono}</div>
      <h2 class="concept-name anim-slide-up">${term.termino}</h2>
      <p style="color:var(--brown);font-family:var(--font-ui);">Un nuevo concepto aguarda ser comprendido...</p>
    `;
    const row = document.createElement('div');
    row.className = 'btn-row';
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = 'Continuar →';
    btn.onclick = () => { this.audio.click(); onContinue(); };
    row.appendChild(btn);
    panel.appendChild(row);
    container.appendChild(panel);
  }

  /* ---------------- Level flow: Scroll ---------------- */
  renderScroll(container, term, onUnderstood) {
    container.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'panel screen-enter flow-card';
    panel.innerHTML = `<h2 class="screen-title">📜 Pergamino del Conocimiento</h2>`;

    const stage = document.createElement('div');
    stage.className = 'scroll-stage';
    const scroll = document.createElement('div');
    scroll.className = 'scroll';
    scroll.innerHTML = `
      <div class="scroll-section">
        <div class="scroll-label">Concepto</div>
        <div class="scroll-text">${term.icono} <strong>${term.termino}</strong></div>
      </div>
      <div class="scroll-section">
        <div class="scroll-label">Definición</div>
        <div class="scroll-text ink-in">${term.definicion}</div>
      </div>
      <div class="scroll-section">
        <div class="scroll-label">Importancia</div>
        <div class="scroll-text ink-in">${term.importancia}</div>
      </div>
    `;
    stage.appendChild(scroll);
    panel.appendChild(stage);
    this.audio.scrollOpen();

    // Acelera el aprendizaje: no pedir confirmación explícita.
    // Al terminar el scroll, pasamos directamente al minijuego.
    container.appendChild(panel);
    this.audio.click();
    setTimeout(() => onUnderstood(), 150);
  }

  /* ---------------- Level flow: Results ---------------- */
  renderResults(container, data, { onContinue, onMap, onOpenChest }) {
    container.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'panel screen-enter flow-card';
    const starStr = '⭐'.repeat(data.stars) + '☆'.repeat(3 - data.stars);

    panel.innerHTML = `
      <h2 class="screen-title">${data.stars >= 2 ? '🎉 ¡Nivel superado!' : '📗 Nivel completado'}</h2>
      <div class="results-stars">${starStr.split('').map(s => `<span class="star-anim">${s}</span>`).join('')}</div>
      <div class="results-grid">
        <div class="results-stat"><div class="rs-label">XP obtenida</div><div class="rs-value">+${data.xp}</div></div>
        <div class="results-stat"><div class="rs-label">NutriCoins</div><div class="rs-value">+${data.coins} 🪙</div></div>
        <div class="results-stat"><div class="rs-label">Tiempo</div><div class="rs-value">${data.timeSpent}s</div></div>
        <div class="results-stat"><div class="rs-label">Precisión</div><div class="rs-value">${data.accuracy}%</div></div>
        <div class="results-stat"><div class="rs-label">Puntos (racha)</div><div class="rs-value">${data.puntos ?? 0}</div></div>
        <div class="results-stat"><div class="rs-label">Racha actual</div><div class="rs-value">${data.streakActual ?? 0}</div></div>
      </div>
    `;

    if (data.congelacionUsada) {
      const cong = document.createElement('p');
      cong.style.cssText = 'text-align:center;font-family:var(--font-ui);font-size:0.82rem;color:var(--forest-dark);margin-top:8px;font-weight:800;';
      cong.textContent = '🧊 Congelación de racha activada (primer fallo protegido)';
      panel.appendChild(cong);
    }

    if (data.doubledXp || data.doubledCoins) {
      const puMsg = document.createElement('p');
      puMsg.style.cssText = 'text-align:center;font-family:var(--font-ui);font-size:0.82rem;color:var(--forest-dark);margin-top:8px;';
      const parts = [];
      if (data.doubledXp) parts.push('⭐ XP x2 aplicado');
      if (data.doubledCoins) parts.push('💰 Duplicador de NutriCoins aplicado');
      puMsg.textContent = parts.join(' · ');
      panel.appendChild(puMsg);
    }

    if (data.leveledUp) {
      const lvlMsg = document.createElement('p');
      lvlMsg.style.cssText = 'text-align:center;font-family:var(--font-ui);font-weight:700;color:var(--forest-dark);margin-top:12px;';
      lvlMsg.textContent = `✨ ¡Subiste a nivel ${data.newLevel}!`;
      panel.appendChild(lvlMsg);
    }

    if (data.newAchievements && data.newAchievements.length) {
      const achMsg = document.createElement('div');
      achMsg.style.cssText = 'text-align:center;margin-top:10px;';
      data.newAchievements.forEach(a => {
        const line = document.createElement('div');
        line.style.cssText = 'font-family:var(--font-ui);color:var(--brown-dark);font-size:0.85rem;';
        line.textContent = `🎖️ Logro desbloqueado: ${a.nombre}`;
        achMsg.appendChild(line);
      });
      panel.appendChild(achMsg);
    }

    if (data.worldUnlocked) {
      const wMsg = document.createElement('p');
      wMsg.style.cssText = 'text-align:center;font-family:var(--font-ui);font-weight:700;color:var(--gold);margin-top:10px;';
      wMsg.textContent = `🔓 ¡Nuevo mundo desbloqueado!`;
      panel.appendChild(wMsg);
    }

    if (data.chestPending) {
      const openBtn = document.createElement('button');
      openBtn.className = 'chest-open-btn';
      openBtn.type = 'button';
      openBtn.setAttribute('aria-label', 'Abrir cofre');
      openBtn.innerHTML = `
        <div class="chest-title">🧰 Cofre encontrado</div>
        <div class="chest-sub">Toca para abrir (50% chance)</div>
      `;

      let opened = false;

      openBtn.onclick = () => {
        if (opened) return;
        opened = true;
        if (openBtn.disabled !== undefined) openBtn.disabled = true;
        openBtn.classList.add('opened');
        if (this.audio && this.audio.click) this.audio.click();

        const result = onOpenChest && onOpenChest();
        // If onOpenChest returned a chest object, render it immediately.
        if (result && result.petId) {
          const pet = window.PET_BY_ID ? window.PET_BY_ID[result.petId] : null;
          openBtn.innerHTML = `
            <div class="chest-title">✨ Cofre abierto</div>
            <div class="chest-pet">${pet ? (pet.emoji + ' ' + pet.nombre) : result.petId}</div>
            <div class="chest-rarity">Rareza: ${result.rarity || ''}</div>
            <div class="chest-hint">Ve a 🐾 Mascotas para equiparla</div>
          `;
        } else {
          // fallback: keep button state; Game re-render may happen later
          openBtn.innerHTML = `
            <div class="chest-title">✨ Cofre abierto</div>
            <div class="chest-sub">Revisa tus mascotas</div>
          `;
        }

        this.particleBurst(panel);
      };

      panel.appendChild(openBtn);
    }

    const row = document.createElement('div');

    row.className = 'btn-row';
    const contBtn = document.createElement('button');
    contBtn.className = 'btn btn-primary';
    contBtn.textContent = 'Siguiente pergamino →';
    contBtn.onclick = () => { this.audio.click(); onContinue(); };
    const mapBtn = document.createElement('button');
    mapBtn.className = 'btn btn-outline';
    mapBtn.textContent = 'Volver al mapa';
    mapBtn.onclick = () => { this.audio.click(); onMap(); };
    row.appendChild(contBtn); row.appendChild(mapBtn);
    panel.appendChild(row);

    container.appendChild(panel);
    this.particleBurst(panel);
  }

  /* ---------------- Encyclopedia ---------------- */
  renderEncyclopedia(container, { levelManager, player }) {
    container.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'panel screen-enter';
    panel.innerHTML = `<h2 class="screen-title">📖 Enciclopedia Nutricional</h2>`;

    const prog = levelManager.totalProgress(player);
    const progTrack = document.createElement('div');
    progTrack.className = 'enc-progress-track';
    progTrack.innerHTML = `<div class="enc-progress-fill" style="width:${prog.pct}%"></div>`;
    panel.appendChild(progTrack);

    const toolbar = document.createElement('div');
    toolbar.className = 'enc-toolbar';
    const search = document.createElement('input');
    search.className = 'enc-search';
    search.placeholder = 'Buscar concepto...';
    toolbar.appendChild(search);

    const filters = document.createElement('div');
    filters.className = 'enc-filters';
    const allChip = document.createElement('button');
    allChip.className = 'enc-filter-chip active';
    allChip.textContent = 'Todos';
    filters.appendChild(allChip);
    let activeWorld = null;
    const chips = [allChip];
    levelManager.worlds.forEach(w => {
      const chip = document.createElement('button');
      chip.className = 'enc-filter-chip';
      chip.textContent = `${w.emoji} M${w.id}`;
      chips.push(chip);
      chip.onclick = () => { activeWorld = w.id; chips.forEach(c => c.classList.remove('active')); chip.classList.add('active'); draw(); };
      filters.appendChild(chip);
    });
    allChip.onclick = () => { activeWorld = null; chips.forEach(c => c.classList.remove('active')); allChip.classList.add('active'); draw(); };
    toolbar.appendChild(filters);
    panel.appendChild(toolbar);

    const grid = document.createElement('div');
    grid.className = 'enc-grid';
    panel.appendChild(grid);

    const draw = () => {
      grid.innerHTML = '';
      const q = nqNormalizeUI(search.value || '');
      levelManager.terms
        .filter(t => activeWorld === null || t.mundo === activeWorld)
        .filter(t => !q || nqNormalizeUI(t.termino).includes(q))
        .forEach(t => {
          const unlocked = player.state.unlockedTerms.includes(t.id);
          const card = document.createElement('div');
          card.className = 'enc-card' + (unlocked ? '' : ' locked');
          if (unlocked) {
            const result = player.state.completedLevels[t.id];
            card.innerHTML = `
              <div class="ec-title">${t.icono} ${t.termino}</div>
              <div class="ec-def">${t.definicion}</div>
              <div class="ec-imp">${t.importancia}</div>
              <div class="ec-date">Mundo ${t.mundo} · ${result ? '⭐'.repeat(result.stars) : ''}</div>
            `;
          } else {
            card.innerHTML = `<div class="ec-title">🔒 ???</div><div class="ec-def">Concepto bloqueado</div>`;
          }
          grid.appendChild(card);
        });
      if (!grid.children.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'No se encontraron conceptos con ese filtro.';
        grid.appendChild(empty);
      }
    };
    search.oninput = draw;
    draw();

    container.appendChild(panel);
  }

  /* ---------------- Achievements ---------------- */
  renderAchievements(container, { player }) {
    container.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'panel screen-enter';
    panel.innerHTML = `<h2 class="screen-title">🎖️ Logros</h2>
      <p class="screen-subtitle">${player.state.achievements.length}/${ACHIEVEMENTS.length} desbloqueados</p>`;

    const grid = document.createElement('div');
    grid.className = 'ach-grid';
    ACHIEVEMENTS.forEach(a => {
      const unlocked = player.state.achievements.includes(a.id);
      const card = document.createElement('div');
      card.className = 'ach-card' + (unlocked ? '' : ' locked');
      card.innerHTML = `
        <div class="ach-emoji">${a.emoji}</div>
        <div>
          <div class="ach-title">${a.nombre}</div>
          <div class="ach-desc">${a.desc}</div>
        </div>
      `;
      grid.appendChild(card);
    });
    panel.appendChild(grid);
    container.appendChild(panel);
  }

  /* ---------------- Modals ---------------- */
  modalAskName(onSubmit) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box anim-zoom-in">
        <h2>🧙 Bienvenido, aprendiz</h2>
        <p>Nutrius necesita saber tu nombre antes de comenzar la aventura por "NutriQuest: El Reino de los Nutrientes".</p>
        <input type="text" id="name-input" maxlength="18" placeholder="Tu nombre..." />
        <button class="btn btn-primary btn-block" id="name-submit">Comenzar aventura</button>
      </div>
    `;
    document.body.appendChild(overlay);
    const input = overlay.querySelector('#name-input');
    input.focus();
    const submit = () => {
      const val = input.value.trim() || 'Aprendiz';
      overlay.remove();
      onSubmit(val);
    };
    overlay.querySelector('#name-submit').onclick = submit;
    input.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  }

  modalConfirm(message, onYes) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box anim-zoom-in">
        <h2>⚠️ Confirmar</h2>
        <p>${message}</p>
        <div class="btn-row">
          <button class="btn btn-danger" id="confirm-yes">Sí, continuar</button>
          <button class="btn btn-outline" id="confirm-no">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#confirm-yes').onclick = () => { overlay.remove(); onYes(); };
    overlay.querySelector('#confirm-no').onclick = () => overlay.remove();
  }

  modalSettings(settings, callbacks) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box anim-zoom-in">
        <h2>⚙️ Configuración</h2>
        <div class="btn-row">
          <button class="btn ${settings.soundOn ? 'btn-gold' : 'btn-outline'}" id="toggle-sound">🔊 Sonido: ${settings.soundOn ? 'On' : 'Off'}</button>
          <button class="btn ${settings.musicOn ? 'btn-gold' : 'btn-outline'}" id="toggle-music">🎵 Música: ${settings.musicOn ? 'On' : 'Off'}</button>
        </div>
        <div class="btn-row">
          <button class="btn btn-danger" id="reset-game">🗑️ Reiniciar progreso</button>
        </div>
        <div class="btn-row">
          <button class="btn btn-outline" id="close-settings">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#toggle-sound').onclick = () => { callbacks.onToggleSound(); overlay.remove(); this.modalSettings(callbacks.getSettings(), callbacks); };
    overlay.querySelector('#toggle-music').onclick = () => { callbacks.onToggleMusic(); overlay.remove(); this.modalSettings(callbacks.getSettings(), callbacks); };
    overlay.querySelector('#reset-game').onclick = () => {
      overlay.remove();
      this.modalConfirm('Esto borrará todo tu progreso permanentemente. ¿Deseas continuar?', callbacks.onReset);
    };
    overlay.querySelector('#close-settings').onclick = () => overlay.remove();
  }
}

window.UIManager = UIManager;
