/* =========================================================
   NutriQuest — catalog.js
   Centralizes data for mascotas/ropas, rarezas y cofres.
   ========================================================= */

// Rarezas (de menor a mayor)
const RARITIES = [
  { key: 'comun', label: 'Común', chanceWeight: 55 },
  { key: 'rara', label: 'Rara', chanceWeight: 25 },
  { key: 'epica', label: 'Épica', chanceWeight: 14 },
  { key: 'legendaria', label: 'Legendaria', chanceWeight: 6 }
];

// Mascotas: se asume pixel art como imagen (NO foto real)
// IMPORTANTE: rutas a imágenes deben existir en assets/images/pets/.
// Si no existen, el juego seguirá funcionando con fallback emoji.
const PET_CATALOG = [
  {
    id: 'perro',
    nombre: 'Perro',
    emoji: '🐶',
    // nombre científico (para mostrar en la ficha/colección)
    cientifico: 'Canis lupus familiaris',
    especie: 'Familiar',
    genero: 'Canis',
    rareza: 'comun',
    // image: 'assets/images/pets/perro.png',
    skills: [
      { key: 'micro_pista', nombre: 'Micro‑pista', efecto: 'Una vez por minijuego, aclara la temática (sin revelar la respuesta).' }
    ]
  },
  {
    id: 'gato',
    nombre: 'Gato',
    emoji: '🐱',
    cientifico: 'Felis catus',
    especie: 'Doméstico',
    genero: 'Felis',
    rareza: 'comun',
    // image: 'assets/images/pets/gato.png',
    skills: [
      { key: 'micro_pista', nombre: 'Micro‑pista', efecto: 'Una vez por minijuego, aclara la temática (sin revelar la respuesta).' }
    ]
  },
  {
    id: 'bovino',
    nombre: 'Bovino',
    emoji: '🐄',
    cientifico: 'Bos taurus',
    especie: 'Taurino',
    genero: 'Bos',
    rareza: 'rara',
    // image: 'assets/images/pets/bovino.png',
    skills: [
      { key: 'reduce_duda', nombre: 'Menos errores', efecto: 'Por cada error, reduce en 1 la penalización visual (no cambia el acierto).'}
    ]
  },
  {
    id: 'equino',
    nombre: 'Equino',
    emoji: '🐴',
    cientifico: 'Equus ferus caballus',
    especie: 'Caballo',
    genero: 'Equus',
    rareza: 'rara',
    // image: 'assets/images/pets/equino.png',
    skills: [
      { key: 'sesion_suave', nombre: 'Sesión suave', efecto: '+5s al cronómetro una sola vez por minijuego (límite educativo, no altera demasiado el balance).'}
    ]
  },
  {
    id: 'ovino',
    nombre: 'Ovino',
    emoji: '🐑',
    cientifico: 'Ovis aries',
    especie: 'Oveja',
    genero: 'Ovis',
    rareza: 'rara',
    // image: 'assets/images/pets/ovino.png',
    skills: [
      { key: 'resumen_importancia', nombre: 'Resumen', efecto: 'Al usar una pista del juego, muestra un resumen de “importancia” en lugar de revelar la definición.'}
    ]
  },
  {
    id: 'cabra',
    nombre: 'Caprino',
    emoji: '🐐',
    cientifico: 'Capra hircus',
    especie: 'Cabra',
    genero: 'Capra',
    rareza: 'rara',
    // image: 'assets/images/pets/cabra.png',
    skills: [
      { key: 'refuerzo_vocab', nombre: 'Refuerzo', efecto: 'Cuando fallas, la siguiente “micro‑pista” incluye una palabra clave del glosario del mundo actual.'}
    ]
  },
  {
    id: 'ave',
    nombre: 'Ave',
    emoji: '🐔',
    cientifico: 'Gallus gallus domesticus',
    especie: 'Doméstico',
    genero: 'Gallus',
    rareza: 'epica',
    // image: 'assets/images/pets/ave.png',
    skills: [
      { key: 'pista_extra', nombre: 'Pista extra', efecto: '1 vez por minijuego: añade una pista temática adicional (no revela la respuesta).' }
    ]
  },
  {
    id: 'cerdo',
    nombre: 'Cerdo',
    emoji: '🐖',
    cientifico: 'Sus scrofa domesticus',
    especie: 'Doméstico',
    genero: 'Sus',
    rareza: 'epica',
    // image: 'assets/images/pets/cerdo.png',
    skills: [
      { key: 'bonus_vocab', nombre: 'Bonus de vocabulario', efecto: 'Reduce en 1 el contador de “mistakes” solo para efectos de estrella al final (balance suave).' }
    ]
  },
  {
    id: 'tortuga_nutri',
    nombre: 'Tortuga Nutri',
    emoji: '🐢',
    cientifico: 'Testudo nutricus',
    especie: 'Reptil',
    genero: 'Testudo',
    rareza: 'epica',
    // image: 'assets/images/pets/tortuga_nutri.png',
    skills: [
      { key: 'freeze_streak_once', nombre: 'Congelar racha', efecto: 'Protege tu racha una sola vez por ronda: el primer fallo no la rompe.' }
    ]
  },
  {
    id: 'oruga_epica',
    nombre: 'Oruga Épica',
    emoji: '🐛',
    cientifico: 'Trichophaga nutrivora',
    especie: 'Insecto',
    genero: 'Trichophaga',
    rareza: 'epica',
    // image: 'assets/images/pets/oruga_epica.png',
    skills: [
      { key: 'freeze_streak_once', nombre: 'Congelar racha', efecto: 'Protege tu racha una sola vez por ronda: el primer fallo no la rompe.' }
    ]
  },
  {
    id: 'microbiota',
    nombre: 'Microbiota',
    emoji: '🦠',
    cientifico: 'Microbiota (término colectivo)',
    especie: 'Intestinal',
    genero: 'Microbiota',
    rareza: 'legendaria',
    // image: 'assets/images/pets/microbiota.png',
    skills: [
      { key: 'veterinario_conceptual', nombre: 'Concepto guiado', efecto: 'Cuando el tiempo termina, muestra un “por qué” educativo corto (sin mostrar la respuesta exacta como texto completo).' }
    ]
  }
];

const PET_BY_ID = Object.fromEntries(PET_CATALOG.map(p => [p.id, p]));

// Cofre: 1 mascota por minijuego
const CHEST_TABLE = {
  // usa el peso de rarezas
  pickRarity() {
    const total = RARITIES.reduce((a, r) => a + r.chanceWeight, 0);
    let roll = Math.random() * total;
    for (const r of RARITIES) {
      roll -= r.chanceWeight;
      if (roll <= 0) return r.key;
    }
    return RARITIES[RARITIES.length - 1].key;
  },

  pickPetByRarity(rarityKey) {
    const pool = PET_CATALOG.filter(p => p.rareza === rarityKey);
    if (!pool.length) {
      // fallback
      const any = PET_CATALOG[Math.floor(Math.random() * PET_CATALOG.length)];
      return any.id;
    }
    const pet = pool[Math.floor(Math.random() * pool.length)];
    return pet.id;
  },

  open() {
    const rarity = this.pickRarity();
    const petId = this.pickPetByRarity(rarity);
    return { petId, rarity };
  }
};

window.RARITIES = RARITIES;
window.PET_CATALOG = PET_CATALOG;
window.PET_BY_ID = PET_BY_ID;
window.CHEST_TABLE = CHEST_TABLE;

