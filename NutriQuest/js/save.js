/* =========================================================
   NutriQuest — save.js
   Handles reading/writing game state to LocalStorage.
   ========================================================= */

class SaveManager {
  constructor() {
    this.storageKey = 'nutriquest_save_v1';
    // Para que el progreso no “mezcle” glosarios viejos con el nuevo.
    // main.js puede sobreescribir este valor antes de guardar si se desea.
    this.glosarioVersionKey = 'nutriquest_glosario_v1';
  }


  /**
   * Returns a fresh default save structure.
   */
  getDefaultState() {
    return {
      playerName: '',
      createdAt: Date.now(),
      player: {
        level: 1,
        xp: 0,
        coins: 50,
        equippedOutfit: null,
        equippedPet: null,
        ownedOutfits: [],
        ownedPets: [],
        powerUps: { pista: 0, tiempoExtra: 0, eliminar: 0, duplicador: 0, xp2x: 0 },
        completedLevels: {},   // { termId: { stars, timeSeconds, accuracy, attempts } }
        unlockedTerms: [],     // encyclopedia unlocks (term ids)
        achievements: [],      // unlocked achievement ids
        bestStreak: 0,
        currentStreak: 0,
        // Congelar racha (mascota épica). Se consume al primer fallo protegido.
        // Game resetea esto por ronda.
        streakFreezeConsumed: false
      },
      leaderboard: [],         // array of run entries
      settings: { soundOn: true, musicOn: true }
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Merge with defaults to protect against missing fields from older saves
      const def = this.getDefaultState();
      return this._deepMerge(def, parsed);
    } catch (err) {
      console.error('NutriQuest save load error:', err);
      return null;
    }
  }

  save(state) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
      return true;
    } catch (err) {
      console.error('NutriQuest save write error:', err);
      return false;
    }
  }

  clear() {
    try {
      localStorage.removeItem(this.storageKey);
      // También borramos la versión del glosario para forzar consistencia.
      localStorage.removeItem(this.glosarioVersionKey);
      return true;
    } catch (err) {
      console.error('NutriQuest save clear error:', err);
      return false;
    }
  }


  _deepMerge(base, override) {
    if (typeof base !== 'object' || base === null) return override !== undefined ? override : base;
    const out = Array.isArray(base) ? [...base] : { ...base };
    if (!override || typeof override !== 'object') return out;
    for (const key of Object.keys(base)) {
      if (override[key] === undefined) continue;
      if (typeof base[key] === 'object' && base[key] !== null && !Array.isArray(base[key])) {
        out[key] = this._deepMerge(base[key], override[key]);
      } else {
        out[key] = override[key];
      }
    }
    // Preserve any extra keys the override introduced (forward-compat)
    for (const key of Object.keys(override)) {
      if (!(key in out)) out[key] = override[key];
    }
    return out;
  }
}

window.SaveManager = SaveManager;
