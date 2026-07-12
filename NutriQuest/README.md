# 🌿 NutriQuest: El Reino de los Nutrientes

RPG educativo en **HTML5 + CSS3 + JavaScript (ES6+) puro** (sin frameworks) para
enseñar Nutrición Animal a estudiantes de Medicina Veterinaria y Zootecnia.

Recorre 6 mundos temáticos, recupera 30 "pergaminos del conocimiento" (uno por
cada término del glosario), sube de nivel, gana NutriCoins, compra aspectos y
mascotas, y desbloquea logros — todo funcionando 100% en el navegador, sin
backend ni dependencias externas.

## ▶️ Cómo ejecutarlo

El juego carga su contenido educativo desde `data/glosario.json` usando
`fetch()`. Por seguridad, **los navegadores bloquean esa lectura si abres
`index.html` con doble clic** (protocolo `file://`). Debes servir la carpeta
con un servidor local — cualquiera de estas opciones funciona:

```bash
# Opción 1: Python (viene preinstalado en la mayoría de los sistemas)
cd NutriQuest
python3 -m http.server 8080

# Opción 2: Node.js
cd NutriQuest
npx serve .

# Opción 3: extensión "Live Server" de VS Code
# Clic derecho sobre index.html → "Open with Live Server"
```

Luego abre **http://localhost:8080** (o el puerto que indique tu servidor) en
Chrome, Firefox, Edge o Safari. Si el juego se sube a GitHub Pages, Netlify,
Vercel, etc. funcionará directamente, sin ningún paso adicional.

## 📁 Estructura del proyecto

```
NutriQuest/
├── index.html
├── css/
│   ├── style.css        Tokens de diseño, layout y componentes
│   ├── animations.css   Todas las animaciones (fade, slide, zoom, partículas...)
│   └── responsive.css   Breakpoints para tablet y móvil
├── js/
│   ├── main.js           Punto de entrada / arranque
│   ├── game.js            Orquesta el flujo de nivel y las recompensas
│   ├── player.js          Modelo del jugador (XP, nivel, inventario, logros)
│   ├── ui.js               HUD, mapa, pantallas del flujo de nivel, modales
│   ├── levels.js           Carga el glosario y construye mundos/niveles
│   ├── minigames.js       Los 6 tipos de minijuego
│   ├── shop.js              Catálogo e interacción de la tienda
│   ├── leaderboard.js    Tabla de puntuaciones local
│   ├── save.js              Persistencia en LocalStorage
│   └── audio.js            Efectos de sonido sintetizados (Web Audio API)
├── data/
│   └── glosario.json     Única fuente de verdad del contenido educativo
└── assets/                (reservado para arte/audio propio si se agrega más adelante)
```

## 🎮 Contenido educativo incluido

30 términos de Nutrición Animal, repartidos en 6 mundos de 5 niveles cada uno:

1. 🌾 **Granja Escuela** — fundamentos (nutriente, alimento, ración, dieta, digestión)
2. 🐄 **Rancho Bovino** — nutrición de rumiantes (rumen, fibra, fermentación ruminal...)
3. 🏥 **Hospital Veterinario** — nutrición clínica (desnutrición, caquexia, nutrición enteral/parenteral...)
4. 🧪 **Laboratorio de Nutrición** — bioquímica (proteína, carbohidrato, lípido, vitaminas...)
5. 🐕 **Clínica de Pequeños Animales** — nutrición de mascotas (obesidad canina, palatabilidad...)
6. 🔬 **Centro de Investigación** — temas avanzados (digestibilidad, biodisponibilidad, microbiota...)

Cada término solo usa los tres campos pedidos: **nombre, definición e
importancia**. Para editar, corregir o ampliar el contenido, edita
únicamente `data/glosario.json` — el motor del juego genera mundos, niveles,
minijuegos y enciclopedia automáticamente a partir de ese archivo, así que
puedes añadir más términos sin tocar el código (solo agrega objetos con los
campos `id`, `mundo`, `nivel`, `termino`, `definicion`, `importancia` e
`icono`).

## ✅ Sistemas implementados

- RPG: nivel, XP con barra animada, NutriCoins, streak/racha
- 6 minijuegos aleatorios: opción múltiple, verdadero/falso, completar
  palabra, ordenar definición, emparejar conceptos, arrastrar y soltar
- Power-ups consumibles: pista, tiempo extra, eliminar respuesta incorrecta,
  duplicador de NutriCoins, XP x2
- Tienda: 5 aspectos, 9 mascotas (incluida la mascota fantástica "Microbiota"), power-ups
- Enciclopedia con buscador, filtros por mundo y barra de progreso
- Tabla de puntuaciones local (sin multijugador)
- 9 logros
- Guardado automático en LocalStorage
- Sonido 100% sintetizado con Web Audio API (cero archivos de audio externos)
- Animaciones CSS: fade, slide, zoom, partículas, brillo, apertura de
  pergamino, monedas flotantes, transiciones
- Diseño responsive (PC, tablet, Android, iPhone)

## 🔊 Nota sobre audio y arte

Los efectos de sonido se generan en tiempo real con la Web Audio API (sin
depender de archivos `.mp3`/`.ogg`), así que el juego funciona completamente
offline. Los íconos del juego usan emoji para mantener el proyecto
autocontenido; si quieres reemplazarlos por ilustraciones propias, colócalas
en `assets/images/` y referencia las rutas desde `data/glosario.json` (por
ejemplo, un campo `imagen` adicional) o desde `js/ui.js`.

## 🧪 Probado

El flujo completo (mapa → mundo → nivel → pergamino → minijuego → resultados
→ guardado), los 6 tipos de minijuego, la tienda, la enciclopedia, la tabla
de puntuaciones, los logros y la persistencia entre sesiones fueron
verificados con pruebas automatizadas antes de la entrega.
