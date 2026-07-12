/* =========================================================
   NutriQuest — minigames.js
   Six minigame types, chosen at random per level:
   opción múltiple, verdadero/falso, completar palabra,
   ordenar definición, emparejar conceptos, arrastrar y soltar.
   ========================================================= */

function nqNormalize(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

class MinigameEngine {
  constructor(levelManager, audio) {
    this.lm = levelManager;
    this.audio = audio;
    this.types = ['mc', 'tf', 'fill', 'order', 'match', 'dnd'];
  }

  /**
   * Mounts a random minigame for `term` into `container`.
   * onComplete receives { correct, mistakes, timeSpent, hintUsed, timedOut }
   */
  start(container, term, player, onComplete, forceType = null) {
    const type = forceType || this.types[Math.floor(Math.random() * this.types.length)];
    this._mount(container, type, term, player, onComplete);
  }

  _mount(container, type, term, player, onComplete) {
    container.innerHTML = '';

    // Layout con mascota + contenido
    const mgLayout = document.createElement('div');
    mgLayout.className = 'mg-layout';

    // Fondo temático (pixel art cuando existan assets; fallback CSS)
    mgLayout.classList.add(this._bgClassForWorld(term.mundo));

    const wrap = document.createElement('div');
    wrap.className = 'mg-content anim-fade-in';


    const header = document.createElement('div');
    header.className = 'concept-tag';
    header.style.textAlign = 'center';
    header.textContent = this._typeLabel(type);
    wrap.appendChild(header);

    const body = document.createElement('div');
    body.style.marginTop = '10px';
    wrap.appendChild(body);

    const hintBanner = document.createElement('div');
    hintBanner.className = 'scroll-label';
    hintBanner.style.cssText = 'text-align:center;margin-top:10px;min-height:1.2em;color:var(--forest-dark);';
    wrap.appendChild(hintBanner);

    const footer = document.createElement('div');
    footer.className = 'mg-footer';
    const timerEl = document.createElement('div');
    timerEl.className = 'mg-timer';
    const powerRow = document.createElement('div');
    powerRow.className = 'mg-powerups';
    footer.appendChild(timerEl);
    footer.appendChild(powerRow);
    wrap.appendChild(footer);

    // Mascota al lado (si está equipada)
    const petSide = document.createElement('div');
    petSide.className = 'mg-pet-side';
    const equippedPetId = player.state.equippedPet;
    const pet = window.PET_BY_ID && equippedPetId ? window.PET_BY_ID[equippedPetId] : null;

    if (pet) {
      const img = document.createElement('img');
      img.className = 'mg-pet-img';
      img.src = pet.image;
      img.alt = pet.nombre;
      img.style.imageRendering = 'pixelated';
      img.onerror = () => { img.remove(); const s = document.createElement('div'); s.className = 'mg-pet-fallback'; s.textContent = pet.emoji || '🐾'; petSide.appendChild(s); };

      petSide.appendChild(img);

      const petName = document.createElement('div');
      petName.className = 'mg-pet-name';
      petName.textContent = pet.nombre;
      petSide.appendChild(petName);
    } else {
      const empty = document.createElement('div');
      empty.className = 'mg-pet-empty';
      empty.textContent = '🐾';
      petSide.appendChild(empty);
    }

    mgLayout.appendChild(petSide);
    mgLayout.appendChild(wrap);
    container.appendChild(mgLayout);


    const state = { mistakes: 0, hintUsed: false, timeLeft: 45, timerId: null, done: false, startTs: Date.now() };
    timerEl.textContent = `⏱ ${state.timeLeft}s`;

    let builder = null;

    const finish = (correct, opts = {}) => {
      if (state.done) return;
      state.done = true;
      clearInterval(state.timerId);
      const timeSpent = Math.max(1, Math.round((Date.now() - state.startTs) / 1000));
      onComplete({ correct, mistakes: state.mistakes, timeSpent, hintUsed: state.hintUsed, timedOut: !!opts.timedOut });
    };

    state.timerId = setInterval(() => {
      state.timeLeft -= 1;
      timerEl.textContent = `⏱ ${Math.max(0, state.timeLeft)}s`;
      if (state.timeLeft <= 30 && state.timeLeft > 0) timerEl.style.background = 'rgba(168,64,42,0.28)';
      if (state.timeLeft <= 0) {
        clearInterval(state.timerId);
        if (builder && builder.revealCorrect) builder.revealCorrect();
        state.mistakes += 2;
        hintBanner.textContent = '⏰ ¡Se acabó el tiempo! La respuesta correcta se ha revelado.';
        setTimeout(() => finish(true, { timedOut: true }), 1000);
      }
    }, 1000);

    const buildersMap = {
      mc: () => this._buildMC(term, finish, state, this.audio, this.lm, body),
      tf: () => this._buildTF(term, finish, state, this.audio, this.lm, body),
      fill: () => this._buildFill(term, finish, state, this.audio, body),
      order: () => this._buildOrder(term, finish, state, this.audio, body),
      match: () => this._buildMatch(term, finish, state, this.audio, this.lm, body),
      dnd: () => this._buildDnd(term, finish, state, this.audio, this.lm, body)
    };
    builder = buildersMap[type]();

    const renderPowerRow = () => {
      powerRow.innerHTML = '';
      const pu = player.state.powerUps;

      const hintBtn = document.createElement('button');
      hintBtn.className = 'mg-powerup-btn';
      hintBtn.textContent = `💡 Pista (${pu.pista || 0})`;
      hintBtn.disabled = !pu.pista || state.hintUsed;
      hintBtn.onclick = () => {
        if (!player.usePowerUp('pista')) return;
        state.hintUsed = true;
        this.audio.powerup();
        hintBanner.textContent = builder.onHint ? builder.onHint() : `Pista: ${term.importancia}`;
        renderPowerRow();
      };
      powerRow.appendChild(hintBtn);

      const timeBtn = document.createElement('button');
      timeBtn.className = 'mg-powerup-btn';
      timeBtn.textContent = `⏳ +15s (${pu.tiempoExtra || 0})`;
      timeBtn.disabled = !pu.tiempoExtra || state.done;
      timeBtn.onclick = () => {
        if (!player.usePowerUp('tiempoExtra')) return;
        state.timeLeft += 15;
        this.audio.powerup();
        renderPowerRow();
      };
      powerRow.appendChild(timeBtn);

      if (builder.onEliminate) {
        const elimBtn = document.createElement('button');
        elimBtn.className = 'mg-powerup-btn';
        elimBtn.textContent = `❌ Eliminar (${pu.eliminar || 0})`;
        elimBtn.disabled = !pu.eliminar || state.done;
        elimBtn.onclick = () => {
          if (!player.usePowerUp('eliminar')) return;
          this.audio.powerup();
          builder.onEliminate();
          renderPowerRow();
        };
        powerRow.appendChild(elimBtn);
      }
    };
    renderPowerRow();
    wrap.insertBefore(builder.el, hintBanner);
  }

  _typeLabel(type) {
    return {
      mc: '🎯 Opción múltiple',
      tf: '✅ Verdadero o Falso',
      fill: '✏️ Completa la palabra',
      order: '🔤 Ordena la definición',
      match: '🔗 Empareja los conceptos',
      dnd: '🖐️ Arrastra y suelta'
    }[type];
  }

  _bgClassForWorld(worldId) {
    // WorldId mapea a escenarios temáticos.
    if (worldId === 3 || worldId === 5) return 'mg-bg-vet'; // veterinaria
    if (worldId === 4 || worldId === 6) return 'mg-bg-nutri'; // nutrición/lab
    return 'mg-bg-generic';
  }


  /* ---------------- Multiple choice ---------------- */
  _buildMC(term, finish, state, audio, lm, mount) {
    const distractors = lm.getDistractors(term.id, 3, term.mundo);
    const options = this.lm._shuffle([
      { text: term.definicion, correct: true },
      ...distractors.map(d => ({ text: d.definicion, correct: false }))
    ]);

    const el = document.createElement('div');
    const q = document.createElement('div');
    q.className = 'mg-question';
    q.textContent = `¿Cuál es la definición correcta de "${term.termino}"?`;
    el.appendChild(q);

    const optWrap = document.createElement('div');
    optWrap.className = 'mg-options';
    el.appendChild(optWrap);

    const buttons = options.map(opt => {
      const b = document.createElement('button');
      b.className = 'mg-option';
      b.textContent = opt.text;
      b.onclick = () => {
        if (state.done) return;
        if (opt.correct) {
          b.classList.add('correct');
          audio.correct();
          buttons.forEach(x => x.disabled = true);
          setTimeout(() => finish(true), 500);
        } else {
          b.classList.add('incorrect', 'anim-shake');
          b.disabled = true;
          state.mistakes += 1;
          audio.incorrect();
        }
      };
      optWrap.appendChild(b);
      return b;
    });

    return {
      el,
      onHint: () => `Pista: ${term.importancia}`,
      onEliminate: () => {
        const remaining = buttons.filter(b => !b.disabled && !b.classList.contains('eliminated'));
        const wrongRemaining = remaining.filter((b, i) => !options[buttons.indexOf(b)].correct);
        if (wrongRemaining.length) {
          const target = wrongRemaining[Math.floor(Math.random() * wrongRemaining.length)];
          target.classList.add('eliminated');
          target.disabled = true;
        }
      },
      revealCorrect: () => {
        buttons.forEach((b, i) => { b.disabled = true; if (options[i].correct) b.classList.add('correct'); });
      }
    };
  }

  /* ---------------- Verdadero / Falso ---------------- */
  _buildTF(term, finish, state, audio, lm, mount) {
    const isTrue = Math.random() < 0.5;
    let shownDef = term.definicion;
    if (!isTrue) {
      const [distractor] = lm.getDistractors(term.id, 1, term.mundo);
      shownDef = distractor.definicion;
    }

    const el = document.createElement('div');
    const q = document.createElement('div');
    q.className = 'mg-question';
    q.textContent = `"${term.termino}" se define como:`;
    el.appendChild(q);

    const statement = document.createElement('div');
    statement.className = 'scroll-text';
    statement.style.cssText = 'background:#fff;border:2px solid var(--brown-light);border-radius:12px;padding:12px 16px;margin-bottom:12px;';
    statement.textContent = `"${shownDef}"`;
    el.appendChild(statement);

    const row = document.createElement('div');
    row.className = 'mg-tf-row';
    const vBtn = document.createElement('button');
    vBtn.className = 'mg-tf-btn v';
    vBtn.textContent = '✔ Verdadero';
    const fBtn = document.createElement('button');
    fBtn.className = 'mg-tf-btn f';
    fBtn.textContent = '✘ Falso';
    row.appendChild(vBtn); row.appendChild(fBtn);
    el.appendChild(row);

    const answer = (guessTrue) => {
      if (state.done) return;
      if (guessTrue === isTrue) {
        audio.correct();
        vBtn.disabled = true; fBtn.disabled = true;
        (guessTrue ? vBtn : fBtn).classList.add('anim-pop');
        setTimeout(() => finish(true), 450);
      } else {
        audio.incorrect();
        state.mistakes += 1;
        row.classList.add('anim-shake');
        setTimeout(() => row.classList.remove('anim-shake'), 400);
      }
    };
    vBtn.onclick = () => answer(true);
    fBtn.onclick = () => answer(false);

    return {
      el,
      onHint: () => `Pista: ${term.importancia}`,
      onEliminate: null,
      revealCorrect: () => {
        vBtn.disabled = true; fBtn.disabled = true;
        (isTrue ? vBtn : fBtn).style.boxShadow = '0 0 0 3px var(--success)';
      }
    };
  }

  /* ---------------- Completar palabra ---------------- */
  _buildFill(term, finish, state, audio, mount) {
    const masked = term.termino.split(' ').map(w => w[0].toUpperCase() + '_'.repeat(Math.max(0, w.length - 1))).join('  ');

    const el = document.createElement('div');
    const q = document.createElement('div');
    q.className = 'mg-question';
    q.textContent = `Esta es la definición: "${term.definicion}" ¿Qué concepto es?`;
    el.appendChild(q);

    const fillWrap = document.createElement('div');
    fillWrap.className = 'mg-fill-word';
    const hintWord = document.createElement('div');
    hintWord.className = 'mg-hint-word';
    hintWord.textContent = masked;
    fillWrap.appendChild(hintWord);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'mg-fill-input';
    input.placeholder = 'Escribe el término...';
    input.autocomplete = 'off';
    fillWrap.appendChild(input);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'Comprobar';
    fillWrap.appendChild(submitBtn);

    el.appendChild(fillWrap);

    const check = () => {
      if (state.done) return;
      if (nqNormalize(input.value) === nqNormalize(term.termino)) {
        audio.correct();
        input.disabled = true; submitBtn.disabled = true;
        input.style.borderColor = 'var(--success)';
        setTimeout(() => finish(true), 400);
      } else {
        audio.incorrect();
        state.mistakes += 1;
        input.classList.add('anim-shake');
        input.style.borderColor = 'var(--danger)';
        setTimeout(() => input.classList.remove('anim-shake'), 400);
      }
    };
    submitBtn.onclick = check;
    input.onkeydown = (e) => { if (e.key === 'Enter') check(); };

    return {
      el,
      onHint: () => `Pista: ${term.importancia}`,
      onEliminate: null,
      revealCorrect: () => { input.value = term.termino; input.disabled = true; submitBtn.disabled = true; }
    };
  }

  /* ---------------- Ordenar definición ---------------- */
  _buildOrder(term, finish, state, audio, mount) {
    const words = term.definicion.replace(/\.$/, '').split(' ').map((w, i) => ({ word: w, id: 'w' + i, used: false }));
    const shuffled = this.lm ? this.lm._shuffle(words) : [...words].sort(() => Math.random() - 0.5);

    const el = document.createElement('div');
    const q = document.createElement('div');
    q.className = 'mg-question';
    q.textContent = `Ordena la definición de "${term.termino}":`;
    el.appendChild(q);

    const slots = document.createElement('div');
    slots.className = 'mg-order-slots';
    el.appendChild(slots);

    const bank = document.createElement('div');
    bank.className = 'mg-order-bank';
    el.appendChild(bank);

    let position = 0;
    const chipEls = {};

    shuffled.forEach(w => {
      const chip = document.createElement('button');
      chip.className = 'mg-chip';
      chip.textContent = w.word;
      chip.onclick = () => {
        if (state.done || w.used) return;
        // Match by word text among not-yet-used chips (not by fixed original
        // position) so that repeated words (e.g. "del" appearing twice in a
        // definition) are interchangeable rather than arbitrarily locked to
        // one specific occurrence, which would look identical to the player.
        if (words[position].word === w.word) {
          w.used = true;
          chip.remove();
          const placed = document.createElement('span');
          placed.className = 'mg-chip';
          placed.style.background = '#DCEFD4';
          placed.style.cursor = 'default';
          placed.textContent = w.word;
          slots.appendChild(placed);
          position += 1;
          audio.click();
          if (position >= words.length) {
            audio.correct();
            setTimeout(() => finish(true), 400);
          }
        } else {
          state.mistakes += 1;
          audio.incorrect();
          chip.classList.add('anim-shake');
          setTimeout(() => chip.classList.remove('anim-shake'), 400);
        }
      };
      bank.appendChild(chip);
      chipEls[w.id] = chip;
    });

    return {
      el,
      onHint: () => {
        const next = words[position];
        if (next && chipEls[next.id]) {
          chipEls[next.id].classList.add('anim-glow');
          setTimeout(() => chipEls[next.id] && chipEls[next.id].classList.remove('anim-glow'), 2500);
        }
        return `Pista: la siguiente palabra correcta brilla en el banco de palabras.`;
      },
      onEliminate: null,
      revealCorrect: () => {
        slots.innerHTML = '';
        bank.innerHTML = '';
        const full = document.createElement('span');
        full.className = 'mg-chip';
        full.style.background = '#DCEFD4';
        full.textContent = term.definicion;
        slots.appendChild(full);
      }
    };
  }

  /* ---------------- Emparejar conceptos ---------------- */
  _buildMatch(term, finish, state, audio, lm, mount) {
    const distractors = lm.getDistractors(term.id, 3, term.mundo);
    const pairTerms = lm._shuffle([term, ...distractors]);
    const leftItems = lm._shuffle(pairTerms.map(t => ({ id: t.id, label: t.termino })));
    const rightItems = lm._shuffle(pairTerms.map(t => ({ id: t.id, label: t.definicion })));

    const el = document.createElement('div');
    const q = document.createElement('div');
    q.className = 'mg-question';
    q.textContent = 'Une cada término con su definición correcta:';
    el.appendChild(q);

    const grid = document.createElement('div');
    grid.className = 'mg-match-grid';
    const leftCol = document.createElement('div');
    leftCol.className = 'mg-match-col';
    const rightCol = document.createElement('div');
    rightCol.className = 'mg-match-col';
    grid.appendChild(leftCol); grid.appendChild(rightCol);
    el.appendChild(grid);

    let selectedLeft = null, matchedCount = 0;
    const leftEls = {}, rightEls = {};

    leftItems.forEach(item => {
      const b = document.createElement('button');
      b.className = 'mg-match-item';
      b.textContent = item.label;
      b.onclick = () => {
        if (state.done || b.classList.contains('matched')) return;
        Object.values(leftEls).forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        selectedLeft = item;
        audio.click();
      };
      leftCol.appendChild(b);
      leftEls[item.id] = b;
    });

    rightItems.forEach(item => {
      const b = document.createElement('button');
      b.className = 'mg-match-item';
      b.textContent = item.label;
      b.onclick = () => {
        if (state.done || !selectedLeft || b.classList.contains('matched')) return;
        if (selectedLeft.id === item.id) {
          b.classList.remove('selected'); b.classList.add('matched');
          leftEls[selectedLeft.id].classList.remove('selected');
          leftEls[selectedLeft.id].classList.add('matched');
          matchedCount += 1;
          audio.correct();
          selectedLeft = null;
          if (matchedCount >= pairTerms.length) setTimeout(() => finish(true), 400);
        } else {
          state.mistakes += 1;
          audio.incorrect();
          b.classList.add('anim-shake');
          leftEls[selectedLeft.id].classList.add('anim-shake');
          setTimeout(() => { b.classList.remove('anim-shake'); leftEls[selectedLeft.id] && leftEls[selectedLeft.id].classList.remove('anim-shake', 'selected'); }, 400);
          selectedLeft = null;
        }
      };
      rightCol.appendChild(b);
      rightEls[item.id] = b;
    });

    return {
      el,
      onHint: () => {
        const unmatched = pairTerms.find(t => !leftEls[t.id].classList.contains('matched'));
        if (unmatched) {
          leftEls[unmatched.id].classList.add('anim-glow');
          rightEls[unmatched.id].classList.add('anim-glow');
          setTimeout(() => { leftEls[unmatched.id] && leftEls[unmatched.id].classList.remove('anim-glow'); rightEls[unmatched.id] && rightEls[unmatched.id].classList.remove('anim-glow'); }, 2500);
        }
        return 'Pista: un par sin resolver está brillando.';
      },
      onEliminate: null,
      revealCorrect: () => {
        pairTerms.forEach(t => {
          leftEls[t.id].classList.add('matched'); leftEls[t.id].disabled = true;
          rightEls[t.id].classList.add('matched'); rightEls[t.id].disabled = true;
        });
      }
    };
  }

  /* ---------------- Arrastrar y soltar ---------------- */
  _buildDnd(term, finish, state, audio, lm, mount) {
    const distractors = lm.getDistractors(term.id, 2, term.mundo);
    const zonesData = lm._shuffle([
      { id: term.id, text: term.definicion, correct: true },
      ...distractors.map(d => ({ id: d.id, text: d.definicion, correct: false }))
    ]);

    const el = document.createElement('div');
    const q = document.createElement('div');
    q.className = 'mg-question';
    q.textContent = 'Arrastra el concepto hasta su definición correcta:';
    el.appendChild(q);

    const drag = document.createElement('div');
    drag.className = 'mg-dnd-drag';
    drag.textContent = `${term.icono || '📜'} ${term.termino}`;
    drag.draggable = true;
    el.appendChild(drag);

    const zonesWrap = document.createElement('div');
    zonesWrap.className = 'mg-dnd-zones';
    el.appendChild(zonesWrap);

    let armed = false;
    drag.onclick = () => { if (state.done) return; armed = !armed; drag.style.opacity = armed ? '0.55' : '1'; };
    drag.ondragstart = (e) => { e.dataTransfer.setData('text/plain', 'drag'); };

    const zoneEls = [];
    zonesData.forEach(zone => {
      const z = document.createElement('div');
      z.className = 'mg-dnd-zone';
      z.textContent = zone.text;
      z.ondragover = (e) => { e.preventDefault(); z.classList.add('dragover'); };
      z.ondragleave = () => z.classList.remove('dragover');
      z.ondrop = (e) => { e.preventDefault(); z.classList.remove('dragover'); resolveDrop(zone, z); };
      z.onclick = () => { if (armed) { armed = false; drag.style.opacity = '1'; resolveDrop(zone, z); } };
      zonesWrap.appendChild(z);
      zoneEls.push({ zone, el: z });
    });

    const resolveDrop = (zone, el) => {
      if (state.done || el.classList.contains('correct') || el.dataset.eliminated) return;
      if (zone.correct) {
        el.classList.add('correct');
        audio.correct();
        drag.style.visibility = 'hidden';
        setTimeout(() => finish(true), 400);
      } else {
        el.classList.add('incorrect', 'anim-shake');
        state.mistakes += 1;
        audio.incorrect();
        setTimeout(() => el.classList.remove('incorrect', 'anim-shake'), 500);
      }
    };

    return {
      el,
      onHint: () => `Pista: ${term.importancia}`,
      onEliminate: () => {
        const wrongZones = zoneEls.filter(z => !z.zone.correct && !z.el.dataset.eliminated);
        if (wrongZones.length) {
          const target = wrongZones[Math.floor(Math.random() * wrongZones.length)];
          target.el.style.opacity = '0.25';
          target.el.style.pointerEvents = 'none';
          target.el.dataset.eliminated = '1';
        }
      },
      revealCorrect: () => {
        const correctZone = zoneEls.find(z => z.zone.correct);
        if (correctZone) correctZone.el.classList.add('correct');
      }
    };
  }
}

window.MinigameEngine = MinigameEngine;
window.nqNormalize = nqNormalize;
