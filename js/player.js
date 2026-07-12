/* =========================================================
   NutriQuest — player.js
   Player model: level, XP, coins, inventory, achievements.
   ========================================================= */

const TOTAL_TERMS = 45;
const TOTAL_PETS = 9;
const TOTAL_OUTFITS = 5;
const TOTAL_WORLDS = 6;

const ACHIEVEMENTS = [
  { id: 'primer_concepto', nombre: 'Primer Paso', desc: 'Aprende tu primer concepto.', emoji: '🌱',
    check: (p) => Object.keys(p.completedLevels).length >= 1 },
  { id: 'diez_conceptos', nombre: 'Aprendiz Aplicado', desc: 'Aprende 10 conceptos.', emoji: '📘',
    check: (p) => Object.keys(p.completedLevels).length >= 10 },
  { id: 'veinticinco_conceptos', nombre: 'Casi Experto', desc: 'Aprende 25 conceptos.', emoji: '📚',
    check: (p) => Object.keys(p.completedLevels).length >= 25 },
  { id: 'precision_perfecta', nombre: 'Precisión Perfecta', desc: 'Consigue 100% de precisión en un nivel.', emoji: '🎯',
    check: (p) => Object.values(p.completedLevels).some(r => r.accuracy >= 100) },
  { id: 'mil_coins', nombre: 'Bolsillos Llenos', desc: 'Acumula 1000 NutriCoins.', emoji: '💰',
    check: (p) => p.coins >= 1000 },
  { id: 'todas_mascotas', nombre: 'Amigo de Todos', desc: 'Consigue todas las mascotas.', emoji: '🐾',
    check: (p) => p.ownedPets.length >= TOTAL_PETS },
  { id: 'todos_mundos', nombre: 'Explorador Total', desc: 'Completa todos los mundos.', emoji: '🗺️',
    check: (p, ctx) => ctx && ctx.worldsCompleted >= TOTAL_WORLDS },
  { id: 'coleccionista', nombre: 'Coleccionista', desc: 'Consigue todos los aspectos.', emoji: '🧥',
    check: (p) => p.ownedOutfits.length >= TOTAL_OUTFITS },
  { id: 'veterinario_experto', nombre: 'Veterinario Experto', desc: 'Completa los 30 conceptos del glosario.', emoji: '🎓',
    check: (p) => Object.keys(p.completedLevels).length >= TOTAL_TERMS }
];

class Player {
  constructor(state) {
    // state is the mutable `player` sub-object from the save file
    this.state = state;
  }

  get level() { return this.state.level; }
  get xp() { return this.state.xp; }
  get coins() { return this.state.coins; }

  /** XP required to go from `level` to `level + 1`. Gentle RPG curve. */
  xpToNextLevel(level = this.state.level) {
    return Math.round(80 + (level - 1) * 45);
  }

  xpProgress() {
    const need = this.xpToNextLevel();
    return { xp: this.state.xp, need, pct: Math.min(100, Math.round((this.state.xp / need) * 100)) };
  }

  /** Adds XP, resolving one or more level-ups. Returns { leveledUp, levelsGained, newLevel }. */
  addXP(amount) {
    let leveledUp = false;
    let levelsGained = 0;
    this.state.xp += Math.round(amount);
    let need = this.xpToNextLevel();
    while (this.state.xp >= need) {
      this.state.xp -= need;
      this.state.level += 1;
      levelsGained += 1;
      leveledUp = true;
      need = this.xpToNextLevel();
    }
    return { leveledUp, levelsGained, newLevel: this.state.level };
  }

  addCoins(amount) { this.state.coins += Math.round(amount); }

  spendCoins(amount) {
    if (this.state.coins < amount) return false;
    this.state.coins -= amount;
    return true;
  }

  ownsOutfit(id) { return this.state.ownedOutfits.includes(id); }
  ownsPet(id) { return this.state.ownedPets.includes(id); }

  buyOutfit(id, price) {
    if (this.ownsOutfit(id)) return false;
    if (!this.spendCoins(price)) return false;
    this.state.ownedOutfits.push(id);
    return true;
  }

  buyPet(id, price) {
    // Deprecated: mascotas se obtienen por cofres (no se compran).
    // Se deja por compatibilidad con saves viejos.
    if (this.ownsPet(id)) return false;
    if (!this.spendCoins(price)) return false;
    this.state.ownedPets.push(id);
    return true;
  }

  grantPet(petId) {
    if (this.ownsPet(petId)) return false;
    this.state.ownedPets.push(petId);
    return true;
  }

  openPetChest() {
    const chest = window.CHEST_TABLE.open();
    this.grantPet(chest.petId);
    // Guardar el último cofre para mostrarlo en UI
    this.state.lastChest = {
      petId: chest.petId,
      rarity: chest.rarity,
      ts: Date.now()
    };
    return chest;
  }


  buyPowerUp(key, price, qty = 1) {
    if (!this.spendCoins(price)) return false;
    this.state.powerUps[key] = (this.state.powerUps[key] || 0) + qty;
    return true;
  }

  usePowerUp(key) {
    if (!this.state.powerUps[key]) return false;
    this.state.powerUps[key] -= 1;
    return true;
  }

  equipOutfit(id) { if (this.ownsOutfit(id) || id === null) this.state.equippedOutfit = id; }
  equipPet(id) { if (this.ownsPet(id) || id === null) this.state.equippedPet = id; }

  /** Records the outcome of a completed level (keeps the best attempt). */
  recordLevelResult(termId, result) {
    const prev = this.state.completedLevels[termId];
    const isFirstClear = !prev;
    if (!prev || result.stars > prev.stars || (result.stars === prev.stars && result.accuracy > prev.accuracy)) {
      this.state.completedLevels[termId] = result;
    }
    if (!this.state.unlockedTerms.includes(termId)) {
      this.state.unlockedTerms.push(termId);
    }
    return { isFirstClear };
  }

  registerStreak(correct) {
    if (correct) {
      this.state.currentStreak += 1;
      if (this.state.currentStreak > this.state.bestStreak) this.state.bestStreak = this.state.currentStreak;
    } else {
      this.state.currentStreak = 0;
    }
  }

  /** Returns array of newly-unlocked achievement ids. */
  evaluateAchievements(ctx) {
    const unlocked = [];
    for (const ach of ACHIEVEMENTS) {
      if (this.state.achievements.includes(ach.id)) continue;
      if (ach.check(this.state, ctx)) {
        this.state.achievements.push(ach.id);
        unlocked.push(ach.id);
      }
    }
    return unlocked;
  }
}

window.Player = Player;
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.TOTAL_TERMS = TOTAL_TERMS;
window.TOTAL_PETS = TOTAL_PETS;
window.TOTAL_OUTFITS = TOTAL_OUTFITS;
window.TOTAL_WORLDS = TOTAL_WORLDS;
