/* =========================================================
   NutriQuest — leaderboard.js
   Local (single-device) scoreboard. No multiplayer.
   ========================================================= */

class LeaderboardManager {
  constructor(state) {
    this.state = state; // reference to save.leaderboard array holder
  }

  /** entry: { nombre, tiempo, xp, coins, precision, estrellas, racha, puntos } */
  addEntry(entry) {
    const record = {
      nombre: entry.nombre,
      fecha: new Date().toLocaleDateString(),
      tiempo: entry.tiempo,
      xp: entry.xp,
      coins: entry.coins,
      precision: entry.precision,
      estrellas: entry.estrellas,
      racha: entry.racha,
      puntos: entry.puntos ?? 0
    };
    this.state.leaderboard.push(record);
    // Orden general:
    // 1) precisión DESC
    // 2) tiempo ASC
    this.state.leaderboard.sort((a, b) => {
      if (b.precision !== a.precision) return b.precision - a.precision;
      return a.tiempo - b.tiempo;
    });
    this.state.leaderboard = this.state.leaderboard.slice(0, 50);
    return record;
  }

  topPrecision(n = 20) {
    return [...this.state.leaderboard].sort((a, b) => {
      if ((b.precision ?? 0) !== (a.precision ?? 0)) return (b.precision ?? 0) - (a.precision ?? 0);
      return (a.tiempo ?? 0) - (b.tiempo ?? 0);
    }).slice(0, n);
  }

  topPuntos(n = 20) {
    return [...this.state.leaderboard].sort((a, b) => {
      if ((b.puntos ?? 0) !== (a.puntos ?? 0)) return (b.puntos ?? 0) - (a.puntos ?? 0);
      // desempate: precisión DESC
      if ((b.precision ?? 0) !== (a.precision ?? 0)) return (b.precision ?? 0) - (a.precision ?? 0);
      return (a.tiempo ?? 0) - (b.tiempo ?? 0);
    }).slice(0, n);
  }

  _groupByPlayerBest() {
    // Consolidación por jugador (nombre): tabla general de TODOS los niveles
    // Orden de ranking:
    // 1) mejor precisión (max)
    // 2) mejor tiempo (min)
    // 3) mejor puntos (max) (para romper empates)
    const byName = new Map();

    for (const e of this.state.leaderboard) {
      const nombre = e.nombre ?? 'Aprendiz';
      const prev = byName.get(nombre);
      const item = {
        nombre,
        // mejores métricas del jugador
        bestPrecision: e.precision ?? 0,
        bestTiempo: e.tiempo ?? 0,
        bestPuntos: e.puntos ?? 0,
        // detalles opcionales
        fechaPrecision: e.fecha,
        fechaPuntos: e.fecha,
        estrellas: e.estrellas ?? 0,
        racha: e.racha ?? 0
      };

      if (!prev) {
        byName.set(nombre, item);
        continue;
      }

      // Mejor precisión (max) + tiempo correspondiente (min si empatan precisión)
      if ((e.precision ?? 0) > prev.bestPrecision) {
        prev.bestPrecision = e.precision ?? 0;
        prev.bestTiempo = e.tiempo ?? 0;
        prev.fechaPrecision = e.fecha;
        prev.estrellas = e.estrellas ?? 0;
        prev.racha = e.racha ?? 0;
      } else if ((e.precision ?? 0) === prev.bestPrecision) {
        if ((e.tiempo ?? 0) < prev.bestTiempo) {
          prev.bestTiempo = e.tiempo ?? 0;
          prev.fechaPrecision = e.fecha;
          prev.estrellas = e.estrellas ?? 0;
          prev.racha = e.racha ?? 0;
        }
      }

      // Puntos mejor (max) (no suma)
      if ((e.puntos ?? 0) > prev.bestPuntos) {
        prev.bestPuntos = e.puntos ?? 0;
        prev.fechaPuntos = e.fecha;
      }
    }

    const arr = Array.from(byName.values());
    arr.sort((a, b) => {
      if ((b.bestPrecision ?? 0) !== (a.bestPrecision ?? 0)) return (b.bestPrecision ?? 0) - (a.bestPrecision ?? 0);
      if ((a.bestTiempo ?? 0) !== (b.bestTiempo ?? 0)) return (a.bestTiempo ?? 0) - (b.bestTiempo ?? 0);
      if ((b.bestPuntos ?? 0) !== (a.bestPuntos ?? 0)) return (b.bestPuntos ?? 0) - (a.bestPuntos ?? 0);
      return String(a.nombre).localeCompare(String(b.nombre));
    });

    return arr;
  }

  render(container) {
    container.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'panel screen-enter';
    panel.innerHTML = `<h2 class="screen-title">🏆 Clasificación general</h2>
      <p class="screen-subtitle">Un ranking por jugador con sus mejores resultados (todos los niveles)</p>`;

    const grouped = this._groupByPlayerBest();
    if (!grouped.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Todavía no hay puntuaciones. ¡Completa un nivel para aparecer aquí!';
      panel.appendChild(empty);
      container.appendChild(panel);
      return;
    }

    const table = document.createElement('table');
    table.className = 'lb-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>#</th>
          <th>Jugador</th>
          <th>Precisión</th>
          <th>Tiempo</th>
          <th>Puntos (mejor)</th>
          <th>⭐</th>
          <th>Racha</th>
        </tr>
      </thead>
      <tbody>
        ${grouped.slice(0, 50).map((e, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${this._esc(e.nombre)}</td>
            <td>${e.bestPrecision}%</td>
            <td>${e.bestTiempo}s</td>
            <td>${e.bestPuntos ?? 0}</td>
            <td>${'⭐'.repeat(e.estrellas ?? 0)}</td>
            <td>${e.racha ?? 0}</td>
          </tr>
        `).join('')}
      </tbody>
    `;

    panel.appendChild(table);
    container.appendChild(panel);
  }


  _esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
}

window.LeaderboardManager = LeaderboardManager;
