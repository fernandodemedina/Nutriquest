/* =========================================================
   NutriQuest — game.js
   Orchestrates the level flow (intro → scroll → minigame →
   results → save), reward calculation, and screen navigation.
   ========================================================= */

class Game {
  constructor({ saveManager, state, player, levelManager, audio, shop, leaderboard, ui, minigames, dom }) {
    this.saveManager = saveManager;
    this.state = state;
    this.player = player;
    this.lm = levelManager;
    this.audio = audio;
    this.shop = shop;
    this.leaderboard = leaderboard;
    this.ui = ui;
    this.mg = minigames;
    this.dom = dom; // { hud, screen, footer }
    this.currentScreen = 'map';
    this.currentWorldId = null;
  }

  persist() { this.saveManager.save(this.state); }

  refreshHUD() {
    this.ui.renderHUD(this.dom.hud, this.player, this.state.playerName);
    const soundBtn = document.getElementById('hud-sound-toggle');
    if (soundBtn) {
      soundBtn.textContent = this.state.settings.soundOn ? '🔊' : '🔇';
      soundBtn.onclick = () => {
        this.state.settings.soundOn = !this.state.settings.soundOn;
        this.persist();
        this.refreshHUD();
      };
    }
    const menuBtn = document.getElementById('hud-settings-btn');
    if (menuBtn) {
      menuBtn.onclick = () => {
        this.ui.modalSettings(this.state.settings, {
          getSettings: () => this.state.settings,
          onToggleSound: () => { this.state.settings.soundOn = !this.state.settings.soundOn; this.persist(); this.refreshHUD(); },
          onToggleMusic: () => { this.state.settings.musicOn = !this.state.settings.musicOn; this.persist(); this.audio.refreshMusicState(); this.refreshHUD(); },
          onReset: () => {
            this.saveManager.clear();
            location.reload();
          }
        });
      };
    }
  }

  navigate(screen) {
    this.currentScreen = screen;
    this.currentWorldId = null;
    this.ui.renderFooterNav(this.dom.footer, screen, (s) => this.navigate(s));
    this.dom.footer.style.display = 'flex';

    if (screen === 'map') this.showMap();
    else if (screen === 'shop') this.showShop();
    else if (screen === 'encyclopedia') this.showEncyclopedia();
    else if (screen === 'leaderboard') this.showLeaderboard();
    else if (screen === 'achievements') this.showAchievements();
    this.refreshHUD();
  }

  showMap() {
    this.ui.renderMap(this.dom.screen, {
      levelManager: this.lm,
      player: this.player,
      onSelectWorld: (worldId) => this.showWorld(worldId)
    });
  }

  showWorld(worldId) {
    this.currentWorldId = worldId;
    this.dom.footer.style.display = 'none';
    const world = this.lm.getWorld(worldId);
    this.ui.renderWorldLevels(this.dom.screen, {
      world, levelManager: this.lm, player: this.player,
      onSelectLevel: (term) => this.startLevel(term),
      onBack: () => { this.dom.footer.style.display = 'flex'; this.navigate('map'); }
    });
  }

  showShop() { this.shop.render(this.dom.screen); }
  showEncyclopedia() { this.ui.renderEncyclopedia(this.dom.screen, { levelManager: this.lm, player: this.player }); }
  showLeaderboard() { this.leaderboard.render(this.dom.screen); }
  showAchievements() { this.ui.renderAchievements(this.dom.screen, { player: this.player }); }

  /* ---------------- Level flow ---------------- */
  startLevel(term) {
    this.dom.footer.style.display = 'none';
    const world = this.lm.getWorld(term.mundo);
    this.ui.renderLevelIntro(this.dom.screen, term, world, () => this.showScroll(term, world));
  }

  showScroll(term, world) {
    this.ui.renderScroll(this.dom.screen, term, () => this.showMinigame(term, world));
  }

  showMinigame(term, world) {
    this.mg.start(this.dom.screen, term, this.player, (result) => this.finishLevel(term, world, result));
  }

  finishLevel(term, world, mgResult) {
    const wasNextUnlocked = this.lm.getWorld(term.mundo + 1)
      ? this.lm.isWorldUnlocked(term.mundo + 1, this.player)
      : true;

    // Reset per-ronda flags (para mascotas)
    this.state.player.streakFreezeConsumed = false;

    const reward = this._computeReward(mgResult);

    const { isFirstClear } = this.player.recordLevelResult(term.id, {
      stars: reward.stars, timeSeconds: mgResult.timeSpent, accuracy: reward.accuracy, attempts: mgResult.mistakes + 1
    });

    const isCorrect = (mgResult.mistakes === 0 && !mgResult.timedOut);
    const freezeEligible = this._equippedHasFreezeStreakOnce();
    const canFreezeThisFailure = freezeEligible && !this.state.player.streakFreezeConsumed && !isCorrect;

    // Racha y puntos: si se congela, el primer fallo no rompe la racha
    if (isCorrect) {
      this.player.registerStreak(true);
    } else {
      if (canFreezeThisFailure) {
        this.state.player.streakFreezeConsumed = true;
        // No resetear racha
      } else {
        this.player.registerStreak(false);
      }
    }

    const pointsResult = this._computePoints({ isCorrect, mistakes: mgResult.mistakes, timedOut: !!mgResult.timedOut });

    const xpResult = this.player.addXP(reward.xp);
    this.player.addCoins(reward.coins);


    const ctx = { worldsCompleted: this.lm.worldsCompletedCount(this.player) };
    const newAchIds = this.player.evaluateAchievements(ctx);
    const newAchievements = newAchIds.map(id => ACHIEVEMENTS.find(a => a.id === id));

    const nowNextUnlocked = this.lm.getWorld(term.mundo + 1)
      ? this.lm.isWorldUnlocked(term.mundo + 1, this.player)
      : false;
    const worldUnlocked = !wasNextUnlocked && nowNextUnlocked;

    this.leaderboard.addEntry({
      nombre: this.state.playerName,
      tiempo: mgResult.timeSpent,
      xp: reward.xp,
      coins: reward.coins,
      precision: reward.accuracy,
      estrellas: reward.stars,
      racha: this.player.state.bestStreak,
      puntos: pointsResult.puntos
    });


    this.persist();

    if (xpResult.leveledUp) { this.audio.levelUp(); this.ui.flashXPBar(); }
    else this.audio.coin();
    if (worldUnlocked) this.audio.worldUnlock();
    newAchievements.forEach(a => this.ui.toast(`🎖️ Logro desbloqueado: ${a.nombre}`));

    const chestPending = (Math.random() < 0.5);

    this.ui.renderResults(this.dom.screen, {
      stars: reward.stars, xp: reward.xp, coins: reward.coins,
      timeSpent: mgResult.timeSpent, accuracy: reward.accuracy,
      leveledUp: xpResult.leveledUp, newLevel: xpResult.newLevel,
      newAchievements, worldUnlocked, doubledXp: reward.doubledXp, doubledCoins: reward.doubledCoins,
      chestPending,
      puntos: pointsResult.puntos,
      streakActual: this.player.state.currentStreak,
      congelacionUsada: pointsResult.freezeUsed
    }, {
      onContinue: () => this._goToNextLevel(term, world),

      onMap: () => this.navigate('map'),
      onOpenChest: () => {
        if (!chestPending) return null;
        const chest = this.player.openPetChest();
        this.persist();
        if (window.__nutriquestGame) window.__nutriquestGame.refreshHUD();
        return chest;
      }
    });


    this.refreshHUD();
  }

  _equippedHasFreezeStreakOnce() {
    const petId = this.player.state.equippedPet;
    if (!petId) return false;
    const pet = window.PET_BY_ID ? window.PET_BY_ID[petId] : null;
    if (!pet || !pet.rareza || pet.rareza !== 'epica') return false;
    return (pet.skills || []).some(s => s.key === 'freeze_streak_once');
  }

  _computePoints({ isCorrect, mistakes, timedOut }) {
    // Balance: la “precisión” ya se calcula en _computeReward.
    // Este sistema es independiente y se guarda en el leaderboard.
    // - base por ronda: 10
    // - al acertar: puntos = base * racha (racha>=1)
    // - al errar: quita 8 puntos y resetea racha (salvo mascota que congela)
    // Nota: mistakes/timedOut se usan solo para coherencia futura; el boolean define acierto.

    const base = 10;
    const loss = 8;

    if (isCorrect) {
      const streak = Math.max(1, this.player.state.currentStreak);
      return {
        puntos: base * streak,
        streakUsed: streak,
        freezeUsed: !!this.state.player.streakFreezeConsumed
      };
    }

    // erró
    return {
      puntos: -loss,
      streakUsed: this.player.state.currentStreak,
      freezeUsed: !!this.state.player.streakFreezeConsumed
    };
  }

  _computeReward(mgResult) {
    let accuracy = mgResult.mistakes === 0 ? 100 : Math.max(20, Math.round(100 / (mgResult.mistakes + 1)));
    if (mgResult.timedOut) accuracy = Math.min(accuracy, 30);


    let stars = 1;
    if (accuracy >= 90 && mgResult.timeSpent <= 30) stars = 3;
    else if (accuracy >= 60 || mgResult.timeSpent <= 45) stars = 2;

    let xp = 10 + stars * 20;
    let coins = 5 + stars * 10;

    let doubledXp = false, doubledCoins = false;
    if (this.player.state.powerUps.xp2x > 0) { this.player.usePowerUp('xp2x'); xp *= 2; doubledXp = true; }
    if (this.player.state.powerUps.duplicador > 0) { this.player.usePowerUp('duplicador'); coins *= 2; doubledCoins = true; }

    return { accuracy, stars, xp, coins, doubledXp, doubledCoins };
  }

  _goToNextLevel(term, world) {
    const idx = world.levels.findIndex(t => t.id === term.id);
    const next = world.levels[idx + 1];
    if (next) {
      this.startLevel(next);
    } else {
      this.dom.footer.style.display = 'flex';
      this.navigate('map');
      this.ui.toast(`🏆 ¡Completaste ${world.nombre}!`);
    }
  }
}

window.Game = Game;
