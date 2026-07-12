/* =========================================================
   NutriQuest — shop.js
   Item catalogs + purchase/equip logic + shop screen rendering.
   ========================================================= */

const OUTFITS = [
  { id: 'bata', nombre: 'Bata veterinaria', emoji: '🥼', precio: 100 },
  { id: 'uniforme', nombre: 'Uniforme clínico', emoji: '🩺', precio: 150 },
  { id: 'investigador', nombre: 'Investigador', emoji: '🔬', precio: 200 },
  { id: 'ganadero', nombre: 'Ganadero', emoji: '🤠', precio: 150 },
  { id: 'nutricionista', nombre: 'Nutricionista', emoji: '🥗', precio: 250 }
];

const PETS = [
  { id: 'perro', nombre: 'Perro', emoji: '🐶', precio: 80 },
  { id: 'gato', nombre: 'Gato', emoji: '🐱', precio: 80 },
  { id: 'bovino', nombre: 'Bovino', emoji: '🐄', precio: 150 },
  { id: 'equino', nombre: 'Equino', emoji: '🐴', precio: 180 },
  { id: 'ovino', nombre: 'Ovino', emoji: '🐑', precio: 120 },
  { id: 'cabra', nombre: 'Cabra', emoji: '🐐', precio: 120 },
  { id: 'ave', nombre: 'Ave', emoji: '🐔', precio: 100 },
  { id: 'cerdo', nombre: 'Cerdo', emoji: '🐖', precio: 100 },
  { id: 'microbiota', nombre: 'Microbiota', emoji: '🦠', precio: 350, especial: true }
];

const POWERUPS = [
  { key: 'pista', nombre: 'Pista', emoji: '💡', precio: 30, desc: 'Revela una pista sobre la respuesta correcta.' },
  { key: 'tiempoExtra', nombre: 'Tiempo extra', emoji: '⏳', precio: 30, desc: 'Añade 15 segundos al cronómetro.' },
  { key: 'eliminar', nombre: 'Eliminar incorrecta', emoji: '❌', precio: 40, desc: 'Elimina una respuesta incorrecta.' },
  { key: 'duplicador', nombre: 'Duplicador de NutriCoins', emoji: '💰', precio: 60, desc: 'Duplica las NutriCoins del próximo nivel.' },
  { key: 'xp2x', nombre: 'XP x2', emoji: '⭐', precio: 60, desc: 'Duplica la XP del próximo nivel.' }
];

class ShopManager {
  constructor(player, audio, onChange) {
    this.player = player;
    this.audio = audio;
    this.onChange = onChange || (() => {});
    this.activeTab = 'aspectos';
  }

  buyOutfit(id) {
    const item = OUTFITS.find(o => o.id === id);
    if (!item) return;
    if (this.player.buyOutfit(id, item.precio)) {
      this.audio.purchase();
      this.onChange({ type: 'buy', item });
    } else {
      this.onChange({ type: 'error', message: 'No tienes suficientes NutriCoins.' });
    }
  }

  buyPet(id) {
    const item = PETS.find(p => p.id === id);
    if (!item) return;
    if (this.player.buyPet(id, item.precio)) {
      this.audio.purchase();
      this.onChange({ type: 'buy', item });
    } else {
      this.onChange({ type: 'error', message: 'No tienes suficientes NutriCoins.' });
    }
  }

  buyPowerUp(key) {
    const item = POWERUPS.find(p => p.key === key);
    if (!item) return;
    if (this.player.buyPowerUp(key, item.precio)) {
      this.audio.purchase();
      this.onChange({ type: 'buy', item });
    } else {
      this.onChange({ type: 'error', message: 'No tienes suficientes NutriCoins.' });
    }
  }

  /** Builds the full shop screen DOM into `container`. */
  render(container) {
    container.innerHTML = '';

    const panel = document.createElement('div');
    panel.className = 'panel screen-enter';

    const title = document.createElement('h2');
    title.className = 'screen-title';
    title.textContent = '🏪 Tienda del Reino';
    panel.appendChild(title);

    const sub = document.createElement('p');
    sub.className = 'screen-subtitle';
    sub.textContent = `Tienes ${this.player.coins} NutriCoins`;
    panel.appendChild(sub);

    const tabs = document.createElement('div');
    tabs.className = 'tabs';
    const tabDefs = [
      { key: 'aspectos', label: '🧥 Aspectos' },
      { key: 'mascotas', label: '🐾 Mascotas' },
      { key: 'powerups', label: '⚡ Power-Ups' }
    ];
    tabDefs.forEach(t => {
      const b = document.createElement('button');
      b.className = 'tab-btn' + (this.activeTab === t.key ? ' active' : '');
      b.textContent = t.label;
      b.onclick = () => { this.activeTab = t.key; this.audio.navigate(); this.render(container); };
      tabs.appendChild(b);
    });
    panel.appendChild(tabs);

    const grid = document.createElement('div');
    grid.className = 'item-grid anim-fade-in';

    if (this.activeTab === 'aspectos') this._renderOutfits(grid);
    else if (this.activeTab === 'mascotas') this._renderPets(grid);
    else this._renderPowerUps(grid);

    panel.appendChild(grid);
    container.appendChild(panel);
  }

  _renderOutfits(grid) {
    OUTFITS.forEach(item => {
      const owned = this.player.ownsOutfit(item.id);
      const equipped = this.player.state.equippedOutfit === item.id;
      const card = this._itemCard(item, owned, equipped);
      const btn = document.createElement('button');
      btn.className = 'btn ' + (equipped ? 'btn-outline' : owned ? 'btn-gold' : 'btn-primary');
      btn.textContent = equipped ? 'Puesto ✓' : owned ? 'Equipar' : `Comprar (${item.precio} 🪙)`;
      btn.onclick = () => {
        if (!owned) { this.buyOutfit(item.id); this.render(grid.closest('#screen')); }
        else { this.player.equipOutfit(equipped ? null : item.id); this.audio.click(); this.onChange({ type: 'equip' }); this.render(grid.closest('#screen')); }
      };
      card.appendChild(btn);
      grid.appendChild(card);
    });
  }

  _renderPets(grid) {
    // Ahora las mascotas se obtienen por cofres (no se compran).
    const pets = window.PET_CATALOG || PETS;

    pets.forEach(item => {
      const owned = this.player.ownsPet(item.id);
      const equipped = this.player.state.equippedPet === item.id;
      const card = document.createElement('div');
      card.className = 'item-card' + (owned ? ' owned' : '') + (equipped ? ' equipped' : '');
      const petImg = item.image ? `<div style="width:52px;height:52px;border-radius:14px;background:rgba(107,66,38,0.08);display:flex;align-items:center;justify-content:center;overflow:hidden;border:2px solid rgba(156,114,72,0.5);margin-bottom:4px;">
        <img src="${item.image}" alt="${item.nombre}" style="width:52px;height:52px;image-rendering:pixelated;" onerror="this.style.display='none'" />
        <span style="font-size:1.6rem;">${item.emoji || ''}</span>
      </div>` : '';

      const rarityLabel = item.rareza ? item.rareza : '';
      card.innerHTML = `
        ${petImg}
        <div class="ic-name">${item.nombre}</div>
        <div class="ic-price" style="font-size:0.78rem;">Rareza: ${rarityLabel}</div>
        ${item.cientifico ? `<div class="ic-price" style="font-size:0.72rem;color:var(--brown);">${item.cientifico}</div>` : ''}
        ${item.especial ? '<div class="ic-price">✨ Mascota fantástica</div>' : ''}
      `;

      const btn = document.createElement('button');
      btn.className = 'btn ' + (equipped ? 'btn-outline' : owned ? 'btn-gold' : 'btn-primary');
      btn.textContent = equipped ? 'Activa ✓' : owned ? 'Equipar' : 'Obtenible en cofre';
      btn.disabled = !owned && !equipped;

      btn.onclick = () => {
        if (!owned) return;
        this.player.equipPet(equipped ? null : item.id);
        this.audio.click();
        this.onChange({ type: 'equip' });
        this.render(grid.closest('#screen'));
      };

      card.appendChild(btn);
      grid.appendChild(card);
    });
  }


  _renderPowerUps(grid) {
    POWERUPS.forEach(item => {
      const owned = this.player.state.powerUps[item.key] || 0;
      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <div class="ic-emoji">${item.emoji}</div>
        <div class="ic-name">${item.nombre}</div>
        <div class="ic-price" style="font-size:0.72rem;">${item.desc}</div>
        <div class="ic-price">En inventario: ${owned}</div>
      `;
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      btn.textContent = `Comprar (${item.precio} 🪙)`;
      btn.onclick = () => { this.buyPowerUp(item.key); this.render(grid.closest('#screen')); };
      card.appendChild(btn);
      grid.appendChild(card);
    });
  }

  _itemCard(item, owned, equipped) {
    const card = document.createElement('div');
    card.className = 'item-card' + (owned ? ' owned' : '') + (equipped ? ' equipped' : '');
    card.innerHTML = `
      <div class="ic-emoji">${item.emoji}</div>
      <div class="ic-name">${item.nombre}</div>
      ${item.especial ? '<div class="ic-price">✨ Mascota fantástica</div>' : ''}
    `;
    return card;
  }
}

window.ShopManager = ShopManager;
window.OUTFITS = OUTFITS;
window.PETS = PETS;
window.POWERUPS = POWERUPS;
