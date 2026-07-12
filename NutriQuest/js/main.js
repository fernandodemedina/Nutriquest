/* =========================================================
   NutriQuest — main.js
   Entry point: boots the game once the DOM is ready.
   ========================================================= */

(function () {
  async function boot() {
    const dom = {
      hud: document.getElementById('hud'),
      screen: document.getElementById('screen'),
      footer: document.getElementById('footer-nav')
    };

    // Quitar pantalla de “Cargando…” lo antes posible
    // (evita el parpadeo si el navegador tarda poco/mucho en ejecutar JS).
    if (dom && dom.screen) {
      dom.screen.innerHTML = '';
    }


    const saveManager = new SaveManager();

    // Cargar glosario primero para validar guardados.
    //
    // Fuente de verdad: el glosario EMBEBIDO en js/glosario_embedded.js
    // (window.GLOSARIO_TERMS / window.GLOSARIO_SIG). Ese archivo ya se carga
    // sin red (cero fetch) en CUALQUIER arranque, incluido el primero, así
    // que ya cumple el objetivo de "2º arranque instantáneo" por sí solo.
    //
    // IMPORTANTE: antes había además una caché de este glosario en
    // localStorage. Se ha quitado a propósito: como se leía ANTES de mirar
    // el glosario embebido y nunca se invalidaba, cualquier edición futura
    // de data/glosario.json (p. ej. corregir a qué `mundo`/`nivel` pertenece
    // un término) quedaba oculta para siempre en cualquier navegador que ya
    // tuviera algo cacheado — causando que aparecieran términos "viejos" o
    // mal ubicados (p. ej. un término de nutrientes apareciendo en el
    // Mundo 1 - Nivel 1). Limpiamos cualquier caché vieja por si quedó de
    // una sesión anterior.
    try { localStorage.removeItem('nutriquest_glosario_cache_v1'); } catch (e) {}

    let loadedTerms = [];
    let signature = null;

    // 1) Fuente primaria: glosario embebido (siempre disponible, cero red).
    if (typeof window.GLOSARIO_TERMS !== 'undefined' && Array.isArray(window.GLOSARIO_TERMS) && window.GLOSARIO_TERMS.length) {
      loadedTerms = window.GLOSARIO_TERMS;
      signature = typeof window.GLOSARIO_SIG !== 'undefined' ? window.GLOSARIO_SIG : null;
    }

    // 2) Último recurso: fetch, solo si por algún motivo el embed no cargó
    //    (p. ej. se borró/renombró js/glosario_embedded.js). No se cachea el
    //    resultado en localStorage, para no reintroducir el mismo problema.
    if (!loadedTerms || !loadedTerms.length) {
      try {
        const resForVersion = await fetch('data/glosario.json');
        if (resForVersion.ok) {
          loadedTerms = await resForVersion.json();
        } else {
          loadedTerms = [];
        }
      } catch (e) {
        loadedTerms = [];
      }

      if (loadedTerms && loadedTerms.length) {
        signature = (() => {
          const count = loadedTerms.length;
          const ids = loadedTerms.slice(0, 60).map(t => t.id).join(',');
          return count + '|' + ids;
        })();
      }
    }

    // Si cambia el glosario, se limpia el progreso para que el juego muestre todo con el nuevo.
    // (signature ya se calcula arriba, siempre a partir de la fuente de verdad más reciente)

    const prevSignature = localStorage.getItem(saveManager.glosarioVersionKey);
    const shouldReset = prevSignature && prevSignature !== signature;

    const existing = shouldReset ? null : saveManager.load();
    if (shouldReset) {
      saveManager.clear();
    }

    const isNew = !existing;
    const state = existing || saveManager.getDefaultState();
    localStorage.setItem(saveManager.glosarioVersionKey, signature);


    const player = new Player(state.player);
    const audio = new AudioManager(() => state.settings);

    // Unlock the WebAudio context on the very first user interaction
    // (required by browser autoplay policies) and start ambient music.
    document.addEventListener('pointerdown', () => {
      audio._ensureCtx();
      audio.refreshMusicState();
    }, { once: true });

    const leaderboard = new LeaderboardManager(state);
    const ui = new UIManager(audio);

    const shop = new ShopManager(player, audio, (evt) => {
      if (evt.type === 'error') ui.toast(evt.message);
      saveManager.save(state);
      if (window.__nutriquestGame) window.__nutriquestGame.refreshHUD();
    });

    const levelManager = new LevelManager();

    // Versión "super rápida": renderiza el mapa con una porción mínima
    // (mundo 1) y luego hidrata el resto en background.
    if (!loadedTerms || !loadedTerms.length) {
      renderLoadError(dom.screen, new Error('El glosario está vacío o no se pudo cargar.'));
      return;
    }

    // 1) Render mínimo: mundo 1 (lo necesario para que el usuario empiece)
    try {
      levelManager.loadFromTerms(loadedTerms, { subsetWorlds: [1] });
    } catch (err) {
      renderLoadError(dom.screen, err);
      return;
    }

    const minigames = new MinigameEngine(levelManager, audio);

    // 2) Hidratar el resto de mundos (sin bloquear el arranque)
    //    Nota: UI/enciclopedia dependen de levelManager.terms, así que
    //    se actualizan al completar.
    setTimeout(() => {
      try {
        levelManager.loadFromTerms(loadedTerms);
        if (window.__nutriquestGame && window.__nutriquestGame.currentScreen === 'map') {
          window.__nutriquestGame.navigate('map');
        } else if (window.__nutriquestGame && window.__nutriquestGame.currentScreen === 'shop') {
          // no hace falta; solo para seguridad visual
        }
      } catch (e) {
        console.warn('NutriQuest hydrate error:', e);
      }
    }, 50);


    const game = new Game({
      saveManager, state, player, levelManager, audio, shop, leaderboard, ui, minigames, dom
    });
    window.__nutriquestGame = game;

    if (isNew) {
      ui.modalAskName((name) => {
        state.playerName = name;
        saveManager.save(state);
        game.navigate('map');
      });
    } else {
      game.navigate('map');
    }
  }

  function renderLoadError(screenEl, err) {
    screenEl.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'panel screen-enter';
    panel.innerHTML = `
      <h2 class="screen-title">⚠️ No se pudo cargar el glosario</h2>
      <p style="text-align:center;">NutriQuest necesita leer <code>data/glosario.json</code> con <code>fetch()</code>.
      La mayoría de los navegadores bloquean esa lectura cuando el archivo se abre directamente con doble clic
      (protocolo <code>file://</code>).</p>
      <p style="text-align:center;"><strong>Solución:</strong> sirve la carpeta con un servidor local. Por ejemplo:</p>
      <p style="text-align:center;">
        <code>python3 -m http.server 8080</code><br>
        o<br>
        <code>npx serve .</code>
      </p>
      <p style="text-align:center;">Luego abre <code>http://localhost:8080</code> en tu navegador.</p>
      <p style="text-align:center;font-size:0.8rem;color:var(--brown);">Detalle técnico: ${err && err.message ? err.message : err}</p>
      <div class="btn-row"><button class="btn btn-primary" onclick="location.reload()">Reintentar</button></div>
    `;
    screenEl.appendChild(panel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
