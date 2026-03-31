<template>
  <div class="scene-container">
    <svg :viewBox="viewBox" class="scene-svg" :class="{ 'scene-breakout': scene === 'mila-closeup' }">
      <!-- Dynamic scene based on prop -->
      <component :is="'g'" v-html="sceneContent" />
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  scene: { type: String, default: 'forest-intro' }
})

const viewBox = '0 0 400 280'

// ============================================================
// SHARED SVG PARTS — reusable character/element builders
// ============================================================

const MILA_COLORS = { hair: '#8B5E3C', skin: '#FDDCB5', dress: '#e85d75', pants: '#4a6fa5', bag: '#d4a030' }

function mila(x, y, scale = 1, extras = '') {
  return `<g transform="translate(${x},${y}) scale(${scale})" class="mila-char">
    <ellipse cx="0" cy="-28" rx="10" ry="12" fill="${MILA_COLORS.hair}"/>
    <path d="M-8,-30 Q-12,-15 -10,-5" stroke="${MILA_COLORS.hair}" stroke-width="4" fill="none" class="hair-blow"/>
    <circle cx="0" cy="-30" r="9" fill="${MILA_COLORS.skin}"/>
    <circle cx="-3" cy="-32" r="1.5" fill="#3a2a1a"/><circle cx="4" cy="-32" r="1.5" fill="#3a2a1a"/>
    <path d="M-3,-27 Q0,-24 3,-27" stroke="#c47a5a" stroke-width="0.8" fill="none"/>
    <rect x="-6" y="-20" width="12" height="16" rx="3" fill="${MILA_COLORS.dress}"/>
    <line x1="-6" y1="-16" x2="-14" y2="-8" stroke="${MILA_COLORS.skin}" stroke-width="3" stroke-linecap="round" class="arm-l"/>
    <line x1="6" y1="-16" x2="14" y2="-8" stroke="${MILA_COLORS.skin}" stroke-width="3" stroke-linecap="round" class="arm-r"/>
    <line x1="-3" y1="-4" x2="-5" y2="8" stroke="${MILA_COLORS.pants}" stroke-width="3" stroke-linecap="round" class="leg-l"/>
    <line x1="3" y1="-4" x2="5" y2="8" stroke="${MILA_COLORS.pants}" stroke-width="3" stroke-linecap="round" class="leg-r"/>
    ${extras}
  </g>`
}

function tree(x, h, color = '#2d6b3f') {
  return `<polygon points="${x},280 ${x + h * 0.35},${280 - h} ${x + h * 0.7},280" fill="${color}"/>`
}

function house(x, y, scale = 1) {
  return `<g transform="translate(${x},${y}) scale(${scale})">
    <polygon points="-25,0 0,-30 25,0" fill="#a05a30"/>
    <rect x="-20" y="0" width="40" height="35" fill="#c4956a" rx="1"/>
    <rect x="-12" y="8" width="10" height="10" rx="1" fill="#ffd080" class="win-glow"/>
    <rect x="3" y="8" width="10" height="10" rx="1" fill="#ffd080" class="win-glow-2"/>
    <rect x="-5" y="18" width="10" height="17" rx="2" fill="#7a4a2a"/>
    <circle cx="3" cy="27" r="1.2" fill="#d4a030"/>
  </g>`
}

function sun(cx, cy, r = 14) {
  return `<circle cx="${cx}" cy="${cy}" r="${r * 0.7}" fill="#ffd700" opacity="0.15"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.35}" fill="#ffd700" opacity="0.8" class="sun-pulse"/>`
}

function bird(x, y) {
  return `<path d="M${x},${y} Q${x + 5},${y - 6} ${x + 10},${y}" stroke="#f5e6d3" stroke-width="1.3" fill="none"/>`
}

function musicNote(x, y, delay = '0s') {
  return `<text x="${x}" y="${y}" fill="#ffd700" font-size="14" opacity="0.7" class="note-float" style="animation-delay:${delay}">♪</text>`
}

function flower(x, y, color = '#ff6b8a', size = 4) {
  return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - size * 3}" stroke="#2a6a2a" stroke-width="1.3"/>
    <circle cx="${x}" cy="${y - size * 3 - size * 0.5}" r="${size}" fill="${color}" class="flower-sway"/>`
}

// ============================================================
// SCENES — each one is a unique illustration for a specific moment
// ============================================================

const scenes = {
  // === LEKTION 1: DER WALD ===

  // Absatz 1: "Es war einmal ein kleines Mädchen namens Mila"
  'mila-portrait': () => {
    return `<defs><radialGradient id="gp1" cx="50%" cy="40%"><stop offset="0%" stop-color="#2a1a3e"/><stop offset="100%" stop-color="#0f1a28"/></radialGradient></defs>
      <rect width="400" height="280" fill="url(#gp1)"/>
      ${sun(320, 50)}
      <!-- Sparkles um Mila -->
      <circle cx="130" cy="90" r="2" fill="#ffd700" opacity="0.5" class="sparkle-1"/>
      <circle cx="270" cy="100" r="2.5" fill="#ffd700" opacity="0.4" class="sparkle-2"/>
      <circle cx="160" cy="200" r="1.5" fill="#ffd700" opacity="0.6" class="sparkle-3"/>
      <!-- Große Mila in der Mitte -->
      ${mila(200, 195, 2.2, `<rect x="5" y="-18" width="6" height="9" rx="2" fill="${MILA_COLORS.bag}" opacity="0.8"/>`)}
      <!-- Boden -->
      <ellipse cx="200" cy="260" rx="80" ry="10" fill="rgba(80,200,100,0.1)"/>`
  },

  // Absatz 2: "Mila lebte in einem kleinen Dorf mit roten Dächern"
  'village': () => {
    return `<rect width="400" height="280" fill="#0f1e28"/>
      ${sun(350, 40, 12)}
      <!-- Hügel -->
      <ellipse cx="200" cy="280" rx="250" ry="60" fill="#1a3a1a"/>
      <!-- Häuser mit roten Dächern -->
      <g transform="translate(80,190)">
        <polygon points="-20,0 0,-25 20,0" fill="#cc4444"/>
        <rect x="-15" y="0" width="30" height="30" fill="#ddc090" rx="1"/>
        <rect x="-8" y="6" width="8" height="8" fill="#ffd080" class="win-glow"/>
        <rect x="2" y="6" width="8" height="8" fill="#ffd080" class="win-glow-2"/>
      </g>
      <g transform="translate(160,185)">
        <polygon points="-22,0 0,-28 22,0" fill="#cc4444"/>
        <rect x="-17" y="0" width="34" height="35" fill="#ddc090" rx="1"/>
        <rect x="-10" y="8" width="9" height="9" fill="#ffd080" class="win-glow"/>
        <rect x="3" y="8" width="9" height="9" fill="#ffd080" class="win-glow-2"/>
      </g>
      <g transform="translate(260,192)">
        <polygon points="-18,0 0,-22 18,0" fill="#cc4444"/>
        <rect x="-13" y="0" width="26" height="28" fill="#ddc090" rx="1"/>
        <rect x="-6" y="6" width="7" height="7" fill="#ffd080" class="win-glow"/>
      </g>
      <!-- Blumen -->
      ${flower(50, 250, '#ff6b8a')} ${flower(120, 255, '#ffd060', 3)} ${flower(300, 248, '#a080ff')} ${flower(340, 255, '#ff8060', 3)}
      <!-- Zaun -->
      <line x1="30" y1="245" x2="370" y2="245" stroke="#8a7a5a" stroke-width="1.5" opacity="0.3"/>
      ${mila(320, 228, 0.9)}`
  },

  // Absatz 3: "Mila schaute aus ihrem Fenster, Vögel flogen"
  'window-birds': () => {
    return `<rect width="400" height="280" fill="#1a2a3e"/>
      <!-- Fensterrahmen -->
      <rect x="100" y="40" width="200" height="200" rx="8" fill="#c4956a"/>
      <rect x="110" y="50" width="180" height="180" rx="4" fill="#87ceeb"/>
      <!-- Fensterkreuz -->
      <line x1="200" y1="50" x2="200" y2="230" stroke="#c4956a" stroke-width="6"/>
      <line x1="110" y1="140" x2="290" y2="140" stroke="#c4956a" stroke-width="6"/>
      <!-- Draußen: Bäume + Himmel -->
      ${tree(120, 70, '#2a6a3a')} ${tree(220, 85, '#267a3a')} ${tree(250, 60, '#2a6a3a')}
      <!-- Vögel draußen -->
      <g class="bird-fly">${bird(150, 80)} ${bird(230, 70)}</g>
      <g class="bird-fly-2">${bird(180, 100)}</g>
      <!-- Mila schaut raus (Silhouette im Fenster) -->
      <g transform="translate(165, 175)">
        <ellipse cx="0" cy="-15" rx="8" ry="10" fill="${MILA_COLORS.hair}"/>
        <circle cx="0" cy="-17" r="7" fill="${MILA_COLORS.skin}"/>
        <circle cx="-2" cy="-19" r="1.2" fill="#3a2a1a"/><circle cx="3" cy="-19" r="1.2" fill="#3a2a1a"/>
        <path d="M-2,-15 Q0,-13 2,-15" stroke="#c47a5a" stroke-width="0.6" fill="none"/>
        <rect x="-5" y="-9" width="10" height="12" rx="2" fill="${MILA_COLORS.dress}"/>
        <!-- Hände auf dem Fensterbrett -->
        <ellipse cx="-8" cy="-2" rx="3" ry="2" fill="${MILA_COLORS.skin}"/>
        <ellipse cx="8" cy="-2" rx="3" ry="2" fill="${MILA_COLORS.skin}"/>
      </g>
      <!-- Vorhänge -->
      <path d="M110,50 Q125,100 115,180" stroke="#e85d75" stroke-width="3" fill="none" opacity="0.5" class="curtain-l"/>
      <path d="M290,50 Q275,100 285,180" stroke="#e85d75" stroke-width="3" fill="none" opacity="0.5" class="curtain-r"/>`
  },

  // Absatz 4: "Sonnenaufgang, geheimnisvolles Geräusch, Melodie"
  'sunrise-melody': () => {
    return `<defs>
        <linearGradient id="sunrise" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ff6b35"/><stop offset="40%" stop-color="#f7931e"/><stop offset="100%" stop-color="#1a2a3e"/>
        </linearGradient>
      </defs>
      <rect width="400" height="280" fill="url(#sunrise)"/>
      <!-- Große Sonne aufgehend -->
      <circle cx="200" cy="200" r="60" fill="#ffd700" opacity="0.3"/>
      <circle cx="200" cy="200" r="40" fill="#ffd700" opacity="0.5"/>
      <circle cx="200" cy="200" r="25" fill="#fff5cc" opacity="0.8" class="sun-pulse"/>
      <!-- Sonnenstrahlen -->
      <line x1="200" y1="130" x2="200" y2="110" stroke="#ffd700" stroke-width="2" opacity="0.4" class="ray-1"/>
      <line x1="150" y1="155" x2="135" y2="140" stroke="#ffd700" stroke-width="2" opacity="0.3" class="ray-2"/>
      <line x1="250" y1="155" x2="265" y2="140" stroke="#ffd700" stroke-width="2" opacity="0.3" class="ray-3"/>
      <!-- Wald-Silhouette -->
      <path d="M0,230 Q50,200 100,220 Q150,190 200,215 Q250,195 300,218 Q350,200 400,225 L400,280 L0,280Z" fill="#0a1a12"/>
      <!-- Musiknoten schweben aus dem Wald -->
      ${musicNote(180, 180)} ${musicNote(220, 165, '0.5s')} ${musicNote(160, 150, '1s')} ${musicNote(240, 140, '1.5s')}
      <!-- Mila klein, schaut Richtung Wald -->
      ${mila(100, 248, 0.8)}`
  },

  // Absatz 5: "Was ist das für ein Klang? fragte sich Mila"
  'mila-wondering': () => {
    return `<rect width="400" height="280" fill="#1a1a2e"/>
      ${sun(50, 40, 10)}
      <!-- Mila groß in der Mitte, fragend -->
      <g transform="translate(200, 180) scale(2)">
        <ellipse cx="0" cy="-28" rx="10" ry="12" fill="${MILA_COLORS.hair}"/>
        <path d="M-8,-30 Q-12,-15 -10,-5" stroke="${MILA_COLORS.hair}" stroke-width="4" fill="none" class="hair-blow"/>
        <circle cx="0" cy="-30" r="9" fill="${MILA_COLORS.skin}"/>
        <!-- Große fragende Augen -->
        <ellipse cx="-3" cy="-32" rx="2" ry="2.5" fill="white"/>
        <ellipse cx="4" cy="-32" rx="2" ry="2.5" fill="white"/>
        <circle cx="-3" cy="-31.5" r="1.3" fill="#3a2a1a"/>
        <circle cx="4" cy="-31.5" r="1.3" fill="#3a2a1a"/>
        <!-- O-Mund (staunend) -->
        <ellipse cx="0" cy="-26" rx="2" ry="2.5" fill="#c47a5a" opacity="0.6"/>
        <rect x="-6" y="-20" width="12" height="16" rx="3" fill="${MILA_COLORS.dress}"/>
        <!-- Hand am Kinn -->
        <path d="M6,-16 Q12,-20 8,-25" stroke="${MILA_COLORS.skin}" stroke-width="3" stroke-linecap="round" fill="none"/>
        <circle cx="8" cy="-26" r="2.5" fill="${MILA_COLORS.skin}"/>
      </g>
      <!-- Fragezeichen -->
      <text x="270" y="100" fill="#ffd700" font-size="40" opacity="0.6" class="question-bob">?</text>
      <!-- Musiknoten -->
      ${musicNote(90, 120)} ${musicNote(310, 90, '0.7s')} ${musicNote(120, 80, '1.2s')}`
  },

  // Absatz 6: "Mila packte ihren Rucksack und schlich aus dem Haus"
  'sneaking-out': () => {
    return `<rect width="400" height="280" fill="#0f1520"/>
      <!-- Haus von außen (Nacht) -->
      ${house(120, 140, 2)}
      <!-- Offene Tür mit Lichtstrahl -->
      <polygon points="195,246 185,275 225,275 215,246" fill="#ffd080" opacity="0.25" class="door-light-pulse"/>
      <!-- Mila schleicht raus mit Rucksack -->
      <g class="mila-sneak">
        ${mila(240, 248, 1, `<rect x="5" y="-18" width="6" height="9" rx="2" fill="${MILA_COLORS.bag}"/>`)}
      </g>
      <!-- Sterne -->
      <circle cx="50" cy="30" r="1.2" fill="#ffd700" opacity="0.5" class="star-1"/>
      <circle cx="150" cy="20" r="1" fill="#ffd700" opacity="0.3" class="star-2"/>
      <circle cx="300" cy="35" r="1.3" fill="#ffd700" opacity="0.4" class="star-1"/>
      <circle cx="350" cy="55" r="0.8" fill="#ffd700" opacity="0.3" class="star-2"/>
      <!-- Mond -->
      <circle cx="340" cy="40" r="15" fill="#ffe8a0" opacity="0.3"/>
      <circle cx="345" cy="37" r="12" fill="#0f1520"/>`
  },

  // Absatz 7: "Zwei Wege — Fluss oder Haus"
  'fork-in-road': () => {
    return `<rect width="400" height="280" fill="#0f2318"/>
      <!-- Wald links und rechts -->
      ${tree(10, 130, '#1a4a2a')} ${tree(50, 150, '#267a3a')} ${tree(80, 120, '#1a4a2a')}
      ${tree(300, 140, '#1a4a2a')} ${tree(340, 155, '#267a3a')} ${tree(370, 125, '#1a4a2a')}
      <!-- Zwei Wege (Y-Gabelung) -->
      <path d="M200,280 Q200,230 200,200" stroke="#5a4a30" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M200,200 Q160,170 100,150" stroke="#5a4a30" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M200,200 Q240,170 310,150" stroke="#5a4a30" stroke-width="10" fill="none" stroke-linecap="round"/>
      <!-- Links: Fluss-Symbol -->
      <path d="M60,140 Q75,130 90,140 Q105,150 120,140" stroke="#4a9edd" stroke-width="3" fill="none" class="ripple-1"/>
      <text x="70" y="125" fill="#93c5fd" font-size="10" opacity="0.6">Fluss</text>
      <!-- Rechts: Haus-Symbol -->
      ${house(320, 125, 0.8)}
      <text x="305" y="118" fill="#fcd34d" font-size="10" opacity="0.6">Haus</text>
      <!-- Mila steht an der Gabelung -->
      ${mila(200, 250, 1.2)}
      <!-- Fragezeichen über Mila -->
      <text x="195" y="200" fill="#ffd700" font-size="16" opacity="0.5" class="question-bob">?</text>`
  },

  // === LEKTION 2: DER FLUSS ===

  // Fridolin am Fluss
  'river': () => {
    return `<defs><linearGradient id="rw" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#1e3a5f"/><stop offset="50%" stop-color="#2a5080"/><stop offset="100%" stop-color="#1e3a5f"/></linearGradient></defs>
      <rect width="400" height="280" fill="#0f1e30"/>
      <!-- Ufer -->
      <path d="M0,180 Q100,165 200,175 Q300,185 400,170 L400,280 L0,280Z" fill="#2a4a1a"/>
      <!-- Wasser -->
      <path d="M0,170 Q100,155 200,165 Q300,175 400,160 L400,210 Q300,225 200,210 Q100,195 0,210Z" fill="url(#rw)" class="water-flow"/>
      <path d="M30,180 Q70,175 110,180" stroke="rgba(100,180,255,0.3)" stroke-width="1.5" fill="none" class="ripple-1"/>
      <path d="M200,175 Q240,170 280,175" stroke="rgba(100,180,255,0.25)" stroke-width="1.5" fill="none" class="ripple-2"/>
      <!-- Stein -->
      <ellipse cx="160" cy="182" rx="18" ry="8" fill="#5a6a5a"/>
      <!-- Fridolin auf dem Stein -->
      <g class="frog-hop" transform="translate(160,165)">
        <ellipse cx="0" cy="0" rx="10" ry="7" fill="#3aaa4a"/>
        <circle cx="-4" cy="-7" r="4" fill="#3aaa4a"/><circle cx="4" cy="-7" r="4" fill="#3aaa4a"/>
        <circle cx="-4" cy="-8" r="2.5" fill="white"/><circle cx="4" cy="-8" r="2.5" fill="white"/>
        <circle cx="-3.5" cy="-8" r="1.2" fill="#1a3a1a"/><circle cx="4.5" cy="-8" r="1.2" fill="#1a3a1a"/>
        <path d="M-4,1 Q0,5 4,1" stroke="#1a5a2a" stroke-width="0.8" fill="none"/>
        <path d="M-6,-10 Q0,-16 6,-10" fill="#4a7af5"/>
      </g>
      <!-- Mila am Ufer -->
      ${mila(280, 205, 1.1)}
      <!-- Fisch springt -->
      <g class="fish-jump"><path d="M80,180 Q85,175 90,180 L85,183Z" fill="#f0a050"/></g>
      <!-- Libelle -->
      <g class="dragonfly-move" transform="translate(220,100)">
        <line x1="0" y1="0" x2="10" y2="0" stroke="#80d0ff" stroke-width="1.2"/>
        <ellipse cx="-2" cy="-2.5" rx="4" ry="1.5" fill="rgba(100,200,255,0.3)" class="wing-flutter"/>
        <ellipse cx="-2" cy="2.5" rx="4" ry="1.5" fill="rgba(100,200,255,0.3)" class="wing-flutter"/>
        <circle cx="12" cy="0" r="1.5" fill="#60b0e0"/>
      </g>`
  },

  // === LEKTION 3: DAS HAUS ===

  'house': () => {
    return `<rect width="400" height="280" fill="#1a150a"/>
      <!-- Sterne -->
      <circle cx="50" cy="25" r="1" fill="#ffd700" opacity="0.4" class="star-1"/>
      <circle cx="150" cy="18" r="1.2" fill="#ffd700" opacity="0.3" class="star-2"/>
      <circle cx="320" cy="35" r="1" fill="#ffd700" opacity="0.5" class="star-1"/>
      <!-- Haus groß -->
      <g transform="translate(200, 110)">
        <polygon points="-50,0 0,-50 50,0" fill="#a05a30" class="house-settle"/>
        <rect x="-40" y="0" width="80" height="70" fill="#c4956a" rx="2"/>
        <rect x="-28" y="12" width="20" height="18" rx="2" fill="#ffd080" class="win-glow"/>
        <rect x="8" y="12" width="20" height="18" rx="2" fill="#ffd080" class="win-glow-2"/>
        <line x1="-18" y1="12" x2="-18" y2="30" stroke="#a05a30" stroke-width="1.2"/>
        <line x1="-28" y1="21" x2="-8" y2="21" stroke="#a05a30" stroke-width="1.2"/>
        <line x1="18" y1="12" x2="18" y2="30" stroke="#a05a30" stroke-width="1.2"/>
        <line x1="8" y1="21" x2="28" y2="21" stroke="#a05a30" stroke-width="1.2"/>
        <!-- Oma-Silhouette im rechten Fenster -->
        <circle cx="18" cy="18" r="4" fill="#c08040" opacity="0.4" class="granny-sil"/>
        <!-- Tür -->
        <rect x="-8" y="40" width="16" height="30" rx="3" fill="#7a4a2a"/>
        <circle cx="4" cy="56" r="1.5" fill="#d4a030"/>
        <!-- Licht aus der Tür -->
        <polygon points="-8,70 -15,85 23,85 16,70" fill="#ffd080" opacity="0.3" class="door-light-pulse"/>
        <!-- Schornstein + Rauch -->
        <rect x="25" y="-35" width="12" height="35" fill="#8a5a3a"/>
        <circle cx="31" cy="-40" r="5" fill="#aaa" opacity="0.12" class="smoke-1"/>
        <circle cx="33" cy="-50" r="7" fill="#aaa" opacity="0.08" class="smoke-2"/>
        <circle cx="30" cy="-60" r="9" fill="#aaa" opacity="0.05" class="smoke-3"/>
      </g>
      <!-- Blumen -->
      ${flower(80, 240, '#ff6b8a')} ${flower(110, 245, '#ffd060', 3)} ${flower(290, 238, '#a080ff')} ${flower(320, 243, '#ff8060', 3)}
      <!-- Boden -->
      <path d="M0,240 Q100,235 200,240 Q300,245 400,238 L400,280 L0,280Z" fill="#2a3a1a"/>
      <!-- Warmes Lichtspiel -->
      <circle cx="200" cy="180" r="100" fill="rgba(255,200,80,0.04)" class="warm-glow"/>`
  },

  // === MILA CLOSEUP (Breakout) ===
  'mila-closeup': () => {
    return `<rect width="400" height="280" fill="#1a1a2e"/>
      <g transform="translate(200, 145)" class="mila-bounce">
        <ellipse cx="0" cy="-62" rx="25" ry="30" fill="${MILA_COLORS.hair}"/>
        <path d="M-20,-65 Q-28,-38 -22,-12" stroke="${MILA_COLORS.hair}" stroke-width="9" fill="none" class="hair-blow"/>
        <path d="M20,-65 Q26,-42 18,-18" stroke="#7B4E2C" stroke-width="7" fill="none" class="hair-blow"/>
        <circle cx="0" cy="-66" r="22" fill="${MILA_COLORS.skin}"/>
        <ellipse cx="-7" cy="-70" rx="3.5" ry="4.5" fill="white"/>
        <ellipse cx="7" cy="-70" rx="3.5" ry="4.5" fill="white"/>
        <circle cx="-6" cy="-69" r="2.5" fill="#5a3a20"/><circle cx="8" cy="-69" r="2.5" fill="#5a3a20"/>
        <circle cx="-5" cy="-70" r="0.8" fill="white"/><circle cx="9" cy="-70" r="0.8" fill="white"/>
        <path d="M-7,-58 Q0,-52 7,-58" stroke="#c47a5a" stroke-width="1.8" fill="none"/>
        <circle cx="-13" cy="-61" r="3.5" fill="#ffb0a0" opacity="0.4"/>
        <circle cx="13" cy="-61" r="3.5" fill="#ffb0a0" opacity="0.4"/>
        <rect x="-15" y="-42" width="30" height="38" rx="7" fill="${MILA_COLORS.dress}"/>
        <line x1="-15" y1="-32" x2="-32" y2="-50" stroke="${MILA_COLORS.skin}" stroke-width="7" stroke-linecap="round" class="wave-hand"/>
        <circle cx="-34" cy="-52" r="5" fill="${MILA_COLORS.skin}" class="wave-hand"/>
        <line x1="15" y1="-28" x2="28" y2="-10" stroke="${MILA_COLORS.skin}" stroke-width="7" stroke-linecap="round"/>
        <line x1="-5" y1="-4" x2="-9" y2="22" stroke="${MILA_COLORS.pants}" stroke-width="7" stroke-linecap="round"/>
        <line x1="5" y1="-4" x2="9" y2="22" stroke="${MILA_COLORS.pants}" stroke-width="7" stroke-linecap="round"/>
        <ellipse cx="-11" cy="24" rx="7" ry="3.5" fill="${MILA_COLORS.hair}"/>
        <ellipse cx="11" cy="24" rx="7" ry="3.5" fill="${MILA_COLORS.hair}"/>
      </g>
      <circle cx="120" cy="80" r="3" fill="#ffd700" opacity="0.6" class="sparkle-1"/>
      <circle cx="280" cy="90" r="2.5" fill="#ffd700" opacity="0.5" class="sparkle-2"/>
      <circle cx="100" cy="200" r="2" fill="#ffd700" opacity="0.4" class="sparkle-3"/>
      <circle cx="300" cy="210" r="3" fill="#ffd700" opacity="0.5" class="sparkle-1"/>`
  }
}

const sceneContent = computed(() => {
  const fn = scenes[props.scene]
  return fn ? fn() : scenes['mila-portrait']()
})
</script>

<style scoped>
.scene-container { width: 100%; border-radius: 0.6rem; overflow: visible; }
.scene-svg { width: 100%; height: auto; border-radius: 0.6rem; display: block; }
.scene-breakout { overflow: visible; }

/* Mila */
.mila-char .hair-blow { animation: hairBlow 3s ease-in-out infinite; }
.mila-char .arm-l { animation: armSwing 1s ease-in-out infinite; transform-origin: -6px -16px; }
.mila-char .arm-r { animation: armSwing 1s ease-in-out infinite reverse; transform-origin: 6px -16px; }
.mila-char .leg-l { animation: legWalk 0.8s ease-in-out infinite; transform-origin: -3px -4px; }
.mila-char .leg-r { animation: legWalk 0.8s ease-in-out infinite reverse; transform-origin: 3px -4px; }
@keyframes hairBlow { 0%,100% { d: path("M-8,-30 Q-12,-15 -10,-5"); } 50% { d: path("M-8,-30 Q-14,-15 -12,-5"); } }
@keyframes armSwing { 0%,100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }
@keyframes legWalk { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }

/* Mila bounce (closeup) */
.mila-bounce { animation: milaBounce 2s ease-in-out infinite; }
@keyframes milaBounce { 0%,100% { transform: translate(200px,145px); } 50% { transform: translate(200px,138px); } }
.wave-hand { animation: waveHand 0.8s ease-in-out infinite; transform-origin: -15px -32px; }
@keyframes waveHand { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(-12deg); } }

/* Mila sneaking */
.mila-sneak { animation: sneakMove 3s ease-in-out infinite; }
@keyframes sneakMove { 0%,100% { transform: translateX(0); } 50% { transform: translateX(8px); } }

/* Sun */
.sun-pulse { animation: sunPulse 3s ease-in-out infinite; }
@keyframes sunPulse { 0%,100% { opacity: 0.8; } 50% { opacity: 1; } }

/* Windows */
.win-glow { animation: winFlicker 3s ease-in-out infinite; }
.win-glow-2 { animation: winFlicker 3.5s ease-in-out infinite 1s; }
@keyframes winFlicker { 0%,100% { fill: #ffd080; } 50% { fill: #ffe8b0; } }

/* Birds */
.bird-fly { animation: birdMove 7s linear infinite; }
.bird-fly-2 { animation: birdMove 9s linear infinite 2s; }
@keyframes birdMove { 0% { transform: translate(0,0); } 100% { transform: translate(150px,-20px); opacity: 0; } }

/* Music notes float up */
.note-float { animation: noteUp 3s ease-out infinite; }
@keyframes noteUp { 0% { transform: translateY(0); opacity: 0.7; } 100% { transform: translateY(-40px); opacity: 0; } }

/* Question mark */
.question-bob { animation: bob 1.5s ease-in-out infinite; }
@keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

/* Rays */
.ray-1 { animation: rayPulse 2s ease-in-out infinite; }
.ray-2 { animation: rayPulse 2.5s ease-in-out infinite 0.3s; }
.ray-3 { animation: rayPulse 2.5s ease-in-out infinite 0.6s; }
@keyframes rayPulse { 0%,100% { opacity: 0.2; } 50% { opacity: 0.5; } }

/* Frog */
.frog-hop { animation: frogHop 3s ease-in-out infinite; }
@keyframes frogHop { 0%,70%,100% { transform: translate(160px,165px) scaleY(1); } 80% { transform: translate(160px,152px) scaleY(1.1); } 90% { transform: translate(160px,165px) scaleY(0.92); } }

/* Water */
.water-flow { animation: waterShift 3s ease-in-out infinite; }
@keyframes waterShift { 0%,100% { transform: translateX(0); } 50% { transform: translateX(4px); } }
.ripple-1 { animation: ripple 2s ease-in-out infinite; }
.ripple-2 { animation: ripple 2.5s ease-in-out infinite 0.5s; }
@keyframes ripple { 0%,100% { transform: translateX(0); opacity: 0.3; } 50% { transform: translateX(6px); opacity: 0.15; } }

/* Fish */
.fish-jump { animation: fishJump 4s ease-in-out infinite 2s; }
@keyframes fishJump { 0%,80%,100% { transform: translate(0,0); opacity: 0; } 85% { transform: translate(0,-15px); opacity: 1; } 95% { transform: translate(3px,-20px) rotate(-15deg); opacity: 1; } }

/* Dragonfly */
.dragonfly-move { animation: dfly 5s ease-in-out infinite; }
@keyframes dfly { 0%,100% { transform: translate(220px,100px); } 33% { transform: translate(250px,90px); } 66% { transform: translate(200px,85px); } }
.wing-flutter { animation: wingFlap 0.12s ease-in-out infinite alternate; }
@keyframes wingFlap { 0% { transform: scaleY(1); } 100% { transform: scaleY(0.3); } }

/* House */
.house-settle { animation: settle 6s ease-in-out infinite; transform-origin: bottom; }
@keyframes settle { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(1.003); } }
.door-light-pulse { animation: doorPulse 4s ease-in-out infinite; }
@keyframes doorPulse { 0%,100% { opacity: 0.25; } 50% { opacity: 0.45; } }
.granny-sil { animation: grannyBob 5s ease-in-out infinite; }
@keyframes grannyBob { 0%,100% { transform: translate(0,0); } 50% { transform: translate(1.5px,0); } }

/* Smoke */
.smoke-1 { animation: smokeRise 5s ease-out infinite; }
.smoke-2 { animation: smokeRise 6s ease-out infinite 1s; }
.smoke-3 { animation: smokeRise 7s ease-out infinite 2s; }
@keyframes smokeRise { 0% { transform: translate(0,0) scale(1); opacity: 0.12; } 100% { transform: translate(-8px,-30px) scale(1.8); opacity: 0; } }

/* Flowers */
.flower-sway { animation: flSway 3s ease-in-out infinite; transform-origin: center bottom; }
@keyframes flSway { 0%,100% { transform: rotate(0); } 50% { transform: rotate(4deg); } }

/* Stars */
.star-1 { animation: twinkle 2s ease-in-out infinite; }
.star-2 { animation: twinkle 3s ease-in-out infinite 1s; }
@keyframes twinkle { 0%,100% { opacity: 0.3; } 50% { opacity: 0.8; } }

/* Warm glow */
.warm-glow { animation: warmG 5s ease-in-out infinite; }
@keyframes warmG { 0%,100% { opacity: 0.04; } 50% { opacity: 0.08; } }

/* Sparkles */
.sparkle-1 { animation: sparkle 1.5s ease-in-out infinite; }
.sparkle-2 { animation: sparkle 2s ease-in-out infinite 0.5s; }
.sparkle-3 { animation: sparkle 1.8s ease-in-out infinite 1s; }
@keyframes sparkle { 0%,100% { opacity: 0; transform: scale(0.5); } 50% { opacity: 0.8; transform: scale(1.3); } }

/* Curtains */
.curtain-l { animation: curtainBlow 4s ease-in-out infinite; transform-origin: top left; }
.curtain-r { animation: curtainBlow 4.5s ease-in-out infinite reverse; transform-origin: top right; }
@keyframes curtainBlow { 0%,100% { transform: scaleX(1); } 50% { transform: scaleX(1.05); } }
</style>
