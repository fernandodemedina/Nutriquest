/* =========================================================
   NutriQuest — levels.js
   Loads data/glosario.json and builds the world/level map.
   Levels are generated dynamically — one level per glossary term.
   ========================================================= */

const WORLDS_META = [
  { id: 1, nombre: 'Granja Escuela', emoji: '🌾', colorA: 'var(--w1-a)', colorB: 'var(--w1-b)' },
  { id: 2, nombre: 'Rancho Bovino', emoji: '🐄', colorA: 'var(--w2-a)', colorB: 'var(--w2-b)' },
  { id: 3, nombre: 'Hospital Veterinario', emoji: '🏥', colorA: 'var(--w3-a)', colorB: 'var(--w3-b)' },
  { id: 4, nombre: 'Laboratorio de Nutrición', emoji: '🧪', colorA: 'var(--w4-a)', colorB: 'var(--w4-b)' },
  { id: 5, nombre: 'Clínica de Pequeños Animales', emoji: '🐕', colorA: 'var(--w5-a)', colorB: 'var(--w5-b)' },
  { id: 6, nombre: 'Centro de Investigación', emoji: '🔬', colorA: 'var(--w6-a)', colorB: 'var(--w6-b)' }
];

class LevelManager {
  constructor() {
    this.terms = [];
    this.worlds = []; // [{ ...meta, levels: [term,...] }]
  }

  async load(jsonPath = 'data/glosario.json') {
    const res = await fetch(jsonPath);
    if (!res.ok) throw new Error('No se pudo cargar el glosario (' + res.status + ')');
    this.terms = await res.json();
    this._buildWorlds();
    return this.terms;
  }

  // Carga desde un array ya parseado (evita fetch duplicados desde main.js)
  loadFromTerms(terms, options = {}) {
    const arr = Array.isArray(terms) ? terms : [];
    const { subsetWorlds = null } = options;

    this.terms = arr;

    // Para arranques ultra rápidos: opcionalmente construir worlds solo con mundos
    // seleccionados (map parcial). Luego se puede "hydrate" con loadFromTerms(fullTerms).
    if (subsetWorlds && Array.isArray(subsetWorlds)) {
      const allowed = new Set(subsetWorlds);
      this.terms = arr.filter(t => allowed.has(t.mundo));
    }

    this._buildWorlds();
    return this.terms;
  }



  _buildWorlds() {
    this.worlds = WORLDS_META.map(meta => ({
      ...meta,
      levels: this.terms
        .filter(t => t.mundo === meta.id)
        .sort((a, b) => a.nivel - b.nivel)
    }));
  }

  getTerm(id) { return this.terms.find(t => t.id === id); }

  getWorld(worldId) { return this.worlds.find(w => w.id === worldId); }

  /** A world is unlocked if it's world 1, or every level of the previous world is completed. */
  isWorldUnlocked(worldId, player) {
    if (worldId === 1) return true;
    const prevWorld = this.getWorld(worldId - 1);
    if (!prevWorld) return false;
    return prevWorld.levels.every(t => !!player.state.completedLevels[t.id]);
  }

  /** A level is unlocked if it's the first in its world, or the previous level is completed. */
  isLevelUnlocked(term, player) {
    const world = this.getWorld(term.mundo);
    if (!this.isWorldUnlocked(term.mundo, player)) return false;
    const idx = world.levels.findIndex(t => t.id === term.id);
    if (idx === 0) return true;
    const prevTerm = world.levels[idx - 1];
    return !!player.state.completedLevels[prevTerm.id];
  }

  worldStars(worldId, player) {
    const world = this.getWorld(worldId);
    let total = 0, max = world.levels.length * 3;
    world.levels.forEach(t => {
      const r = player.state.completedLevels[t.id];
      if (r) total += r.stars;
    });
    return { total, max };
  }

  isWorldCompleted(worldId, player) {
    const world = this.getWorld(worldId);
    return world.levels.every(t => !!player.state.completedLevels[t.id]);
  }

  worldsCompletedCount(player) {
    return this.worlds.filter(w => this.isWorldCompleted(w.id, player)).length;
  }

  totalProgress(player) {
    const done = Object.keys(player.state.completedLevels).length;
    return { done, total: this.terms.length, pct: Math.round((done / this.terms.length) * 100) };
  }

  /** Returns N random distractor terms different from excludeId, optionally same world for coherence. */
  getDistractors(excludeId, count, sameWorldId = null) {
    let pool = this.terms.filter(t => t.id !== excludeId);
    if (sameWorldId) {
      const sameWorld = pool.filter(t => t.mundo === sameWorldId);
      if (sameWorld.length >= count) pool = sameWorld;
    }
    return this._shuffle(pool).slice(0, count);
  }

  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

window.LevelManager = LevelManager;
window.WORLDS_META = WORLDS_META;
