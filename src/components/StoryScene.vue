<template>
  <div class="scene-container" :class="`scene-${scene}`">
    <!-- WALD: Mila steht am Waldrand, Bäume bewegen sich, Vögel fliegen -->
    <svg v-if="scene === 'forest-intro'" viewBox="0 0 400 300" class="scene-svg">
      <!-- Himmel -->
      <defs>
        <radialGradient id="sun-glow" cx="75%" cy="20%"><stop offset="0%" stop-color="#ffd700" stop-opacity="0.4"/><stop offset="100%" stop-color="transparent"/></radialGradient>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1a1a3e"/><stop offset="100%" stop-color="#0f2318"/></linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#sky)"/>
      <circle cx="310" cy="55" r="80" fill="url(#sun-glow)"/>
      <circle cx="310" cy="55" r="14" fill="#ffd700" opacity="0.9" class="sun-pulse"/>
      <!-- Bäume hinten -->
      <g class="trees-back">
        <polygon points="50,280 70,120 90,280" fill="#1a4a2a" opacity="0.6"/>
        <polygon points="120,280 145,100 170,280" fill="#1a4a2a" opacity="0.5"/>
        <polygon points="200,280 220,130 240,280" fill="#1a4a2a" opacity="0.6"/>
        <polygon points="300,280 325,110 350,280" fill="#1a4a2a" opacity="0.5"/>
      </g>
      <!-- Bäume vorne -->
      <g class="trees-front">
        <polygon points="20,300 55,90 90,300" fill="#2d6b3f"/>
        <polygon points="80,300 110,140 140,300" fill="#267a3a"/>
        <polygon points="330,300 360,100 390,300" fill="#2d6b3f"/>
      </g>
      <!-- Pfad -->
      <path d="M180,300 Q200,260 210,240 Q230,200 260,180" stroke="#5a4a30" stroke-width="8" fill="none" opacity="0.4" stroke-linecap="round"/>
      <!-- Mila -->
      <g class="mila-walk" transform="translate(185, 230)">
        <!-- Haare -->
        <ellipse cx="0" cy="-28" rx="10" ry="12" fill="#8B5E3C"/>
        <path d="M-8,-30 Q-12,-15 -10,-5" stroke="#8B5E3C" stroke-width="4" fill="none" class="hair-blow"/>
        <!-- Kopf -->
        <circle cx="0" cy="-30" r="9" fill="#FDDCB5"/>
        <!-- Augen -->
        <circle cx="-3" cy="-32" r="1.5" fill="#3a2a1a"/>
        <circle cx="4" cy="-32" r="1.5" fill="#3a2a1a"/>
        <!-- Lächeln -->
        <path d="M-3,-27 Q0,-24 3,-27" stroke="#c47a5a" stroke-width="0.8" fill="none"/>
        <!-- Körper -->
        <rect x="-6" y="-20" width="12" height="16" rx="3" fill="#e85d75"/>
        <!-- Arme -->
        <line x1="-6" y1="-16" x2="-14" y2="-8" stroke="#FDDCB5" stroke-width="3" stroke-linecap="round" class="arm-swing"/>
        <line x1="6" y1="-16" x2="14" y2="-8" stroke="#FDDCB5" stroke-width="3" stroke-linecap="round" class="arm-swing-r"/>
        <!-- Beine -->
        <line x1="-3" y1="-4" x2="-5" y2="8" stroke="#4a6fa5" stroke-width="3" stroke-linecap="round" class="leg-walk"/>
        <line x1="3" y1="-4" x2="5" y2="8" stroke="#4a6fa5" stroke-width="3" stroke-linecap="round" class="leg-walk-r"/>
        <!-- Rucksack -->
        <rect x="5" y="-18" width="6" height="9" rx="2" fill="#d4a030" opacity="0.8"/>
      </g>
      <!-- Vögel -->
      <g class="bird-fly">
        <path d="M140,60 Q145,52 150,60" stroke="#f5e6d3" stroke-width="1.5" fill="none"/>
        <path d="M155,45 Q160,37 165,45" stroke="#f5e6d3" stroke-width="1.5" fill="none"/>
      </g>
      <g class="bird-fly-2">
        <path d="M250,70 Q255,62 260,70" stroke="#f5e6d3" stroke-width="1.2" fill="none"/>
      </g>
      <!-- Blätter -->
      <ellipse cx="100" cy="50" rx="4" ry="2" fill="#4ade80" opacity="0.6" class="leaf-fall-1"/>
      <ellipse cx="250" cy="30" rx="3" ry="1.5" fill="#86efac" opacity="0.5" class="leaf-fall-2"/>
      <ellipse cx="350" cy="60" rx="3.5" ry="1.8" fill="#4ade80" opacity="0.4" class="leaf-fall-3"/>
    </svg>

    <!-- FLUSS: Fridolin der Frosch am Ufer, Wasser fließt, Fische springen -->
    <svg v-else-if="scene === 'river'" viewBox="0 0 400 300" class="scene-svg">
      <defs>
        <linearGradient id="river-water" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#1e3a5f"/><stop offset="50%" stop-color="#2a5080"/><stop offset="100%" stop-color="#1e3a5f"/></linearGradient>
      </defs>
      <rect width="400" height="300" fill="#0f1e30"/>
      <!-- Ufer -->
      <path d="M0,200 Q80,180 160,195 Q240,210 320,190 Q380,180 400,185 L400,300 L0,300Z" fill="#2a4a1a"/>
      <!-- Wasser -->
      <path d="M0,190 Q80,170 160,185 Q240,200 320,180 Q380,170 400,175 L400,230 Q320,250 240,230 Q160,210 80,230 L0,240Z" fill="url(#river-water)" class="water-flow"/>
      <!-- Wellen -->
      <path d="M30,200 Q60,195 90,200 Q120,205 150,200" stroke="rgba(100,180,255,0.3)" stroke-width="1.5" fill="none" class="ripple-1"/>
      <path d="M180,195 Q210,190 240,195 Q270,200 300,195" stroke="rgba(100,180,255,0.25)" stroke-width="1.5" fill="none" class="ripple-2"/>
      <!-- Steine -->
      <ellipse cx="140" cy="205" rx="15" ry="8" fill="#5a6a5a"/>
      <ellipse cx="250" cy="195" rx="12" ry="6" fill="#4a5a4a"/>
      <!-- Fridolin der Frosch auf dem Stein -->
      <g class="frog-hop" transform="translate(140, 185)">
        <!-- Körper -->
        <ellipse cx="0" cy="0" rx="12" ry="9" fill="#3aaa4a"/>
        <!-- Augen -->
        <circle cx="-5" cy="-8" r="5" fill="#3aaa4a"/>
        <circle cx="5" cy="-8" r="5" fill="#3aaa4a"/>
        <circle cx="-5" cy="-9" r="3" fill="white"/>
        <circle cx="5" cy="-9" r="3" fill="white"/>
        <circle cx="-4" cy="-9" r="1.5" fill="#1a3a1a"/>
        <circle cx="6" cy="-9" r="1.5" fill="#1a3a1a"/>
        <!-- Mund (Lächeln) -->
        <path d="M-5,0 Q0,5 5,0" stroke="#1a5a2a" stroke-width="1" fill="none"/>
        <!-- Mütze -->
        <path d="M-7,-11 Q0,-18 7,-11" fill="#4a7af5"/>
        <!-- Beine -->
        <path d="M-10,5 Q-18,12 -15,15" stroke="#3aaa4a" stroke-width="3" fill="none"/>
        <path d="M10,5 Q18,12 15,15" stroke="#3aaa4a" stroke-width="3" fill="none"/>
      </g>
      <!-- Fisch springt -->
      <g class="fish-jump">
        <path d="M280,210 Q285,205 290,210 L285,213Z" fill="#f0a050"/>
        <circle cx="282" cy="209" r="1" fill="#1a1a2e"/>
      </g>
      <!-- Libellen -->
      <g class="dragonfly" transform="translate(200,120)">
        <line x1="0" y1="0" x2="12" y2="0" stroke="#80d0ff" stroke-width="1.5"/>
        <ellipse cx="-2" cy="-3" rx="5" ry="2" fill="rgba(100,200,255,0.3)" class="wing-flutter"/>
        <ellipse cx="-2" cy="3" rx="5" ry="2" fill="rgba(100,200,255,0.3)" class="wing-flutter"/>
        <circle cx="14" cy="0" r="2" fill="#60b0e0"/>
      </g>
      <!-- Kieselsteine im Wasser (sichtbar durch klares Wasser) -->
      <circle cx="170" cy="225" r="3" fill="#8a9a7a" opacity="0.3"/>
      <circle cx="220" cy="220" r="2.5" fill="#7a8a6a" opacity="0.25"/>
      <circle cx="200" cy="230" r="2" fill="#9aaa8a" opacity="0.2"/>
    </svg>

    <!-- HAUS: Gemütliches Haus, Rauch, warmes Licht, alte Frau am Fenster -->
    <svg v-else-if="scene === 'house'" viewBox="0 0 400 300" class="scene-svg">
      <rect width="400" height="300" fill="#1a150a"/>
      <!-- Sterne -->
      <circle cx="50" cy="30" r="1" fill="#ffd700" opacity="0.4" class="star-twinkle"/>
      <circle cx="150" cy="20" r="1.2" fill="#ffd700" opacity="0.3" class="star-twinkle-2"/>
      <circle cx="320" cy="40" r="1" fill="#ffd700" opacity="0.5" class="star-twinkle"/>
      <circle cx="370" cy="25" r="0.8" fill="#ffd700" opacity="0.3" class="star-twinkle-2"/>
      <!-- Haus -->
      <g transform="translate(140, 80)">
        <!-- Dach -->
        <polygon points="0,80 60,20 120,80" fill="#8a4a2a"/>
        <polygon points="-10,80 60,15 130,80" fill="#a05a30" class="house-settle"/>
        <!-- Wände -->
        <rect x="10" y="80" width="100" height="90" fill="#c4956a" rx="2"/>
        <!-- Fenster (warmes Licht) -->
        <rect x="25" y="95" width="25" height="25" rx="2" fill="#ffd080" class="window-glow"/>
        <rect x="70" y="95" width="25" height="25" rx="2" fill="#ffd080" class="window-glow-2"/>
        <!-- Fensterkreuz -->
        <line x1="37.5" y1="95" x2="37.5" y2="120" stroke="#a05a30" stroke-width="1.5"/>
        <line x1="25" y1="107.5" x2="50" y2="107.5" stroke="#a05a30" stroke-width="1.5"/>
        <line x1="82.5" y1="95" x2="82.5" y2="120" stroke="#a05a30" stroke-width="1.5"/>
        <line x1="70" y1="107.5" x2="95" y2="107.5" stroke="#a05a30" stroke-width="1.5"/>
        <!-- Silhouette im Fenster -->
        <circle cx="82" cy="105" r="5" fill="#c08040" opacity="0.5" class="granny-silhouette"/>
        <!-- Tür -->
        <rect x="45" y="130" width="30" height="40" rx="3" fill="#7a4a2a"/>
        <circle cx="68" cy="152" r="2" fill="#d4a030"/>
        <!-- Licht aus der Tür -->
        <polygon points="45,170 35,185 85,185 75,170" fill="#ffd080" opacity="0.3" class="door-light"/>
        <!-- Schornstein -->
        <rect x="85" y="30" width="15" height="50" fill="#8a5a3a"/>
        <!-- Rauch -->
        <circle cx="92" cy="25" r="6" fill="#aaa" opacity="0.15" class="smoke-1"/>
        <circle cx="95" cy="15" r="8" fill="#aaa" opacity="0.1" class="smoke-2"/>
        <circle cx="90" cy="5" r="10" fill="#aaa" opacity="0.07" class="smoke-3"/>
      </g>
      <!-- Blumen im Garten -->
      <g class="flowers-sway">
        <line x1="160" y1="260" x2="160" y2="245" stroke="#2a6a2a" stroke-width="1.5"/>
        <circle cx="160" cy="243" r="4" fill="#ff6b8a"/>
        <line x1="180" y1="260" x2="180" y2="248" stroke="#2a6a2a" stroke-width="1.5"/>
        <circle cx="180" cy="246" r="3.5" fill="#ffd060"/>
        <line x1="240" y1="260" x2="240" y2="244" stroke="#2a6a2a" stroke-width="1.5"/>
        <circle cx="240" cy="242" r="4" fill="#a080ff"/>
        <line x1="260" y1="260" x2="260" y2="250" stroke="#2a6a2a" stroke-width="1.5"/>
        <circle cx="260" cy="248" r="3" fill="#ff8060"/>
      </g>
      <!-- Boden -->
      <path d="M0,260 Q100,255 200,260 Q300,265 400,258 L400,300 L0,300Z" fill="#2a3a1a"/>
      <!-- Warmes Lichtspiel -->
      <circle cx="200" cy="200" r="120" fill="rgba(255,200,80,0.04)" class="warm-glow-big"/>
    </svg>

    <!-- MILA ALLEIN: Mila als größere Figur, bricht aus dem Rahmen -->
    <svg v-else-if="scene === 'mila-closeup'" viewBox="0 0 400 300" class="scene-svg mila-breakout">
      <rect width="400" height="300" fill="#1a1a2e"/>
      <!-- Großer Mila-Charakter -->
      <g transform="translate(200, 150)" class="mila-bounce">
        <!-- Haare -->
        <ellipse cx="0" cy="-65" rx="28" ry="32" fill="#8B5E3C"/>
        <path d="M-22,-70 Q-30,-40 -25,-15" stroke="#8B5E3C" stroke-width="10" fill="none" class="hair-blow-big"/>
        <path d="M22,-70 Q28,-45 20,-20" stroke="#7B4E2C" stroke-width="8" fill="none" class="hair-blow-big-r"/>
        <!-- Kopf -->
        <circle cx="0" cy="-70" r="24" fill="#FDDCB5"/>
        <!-- Augen (groß, ausdrucksvoll) -->
        <ellipse cx="-8" cy="-75" rx="4" ry="5" fill="white"/>
        <ellipse cx="8" cy="-75" rx="4" ry="5" fill="white"/>
        <circle cx="-7" cy="-74" r="3" fill="#5a3a20"/>
        <circle cx="9" cy="-74" r="3" fill="#5a3a20"/>
        <circle cx="-6" cy="-75" r="1" fill="white"/>
        <circle cx="10" cy="-75" r="1" fill="white"/>
        <!-- Großes Lächeln -->
        <path d="M-8,-62 Q0,-55 8,-62" stroke="#c47a5a" stroke-width="2" fill="none"/>
        <!-- Wangen -->
        <circle cx="-14" cy="-65" r="4" fill="#ffb0a0" opacity="0.4"/>
        <circle cx="14" cy="-65" r="4" fill="#ffb0a0" opacity="0.4"/>
        <!-- Körper -->
        <rect x="-16" y="-44" width="32" height="40" rx="8" fill="#e85d75"/>
        <!-- Arme (winkend!) -->
        <line x1="-16" y1="-35" x2="-35" y2="-55" stroke="#FDDCB5" stroke-width="8" stroke-linecap="round" class="wave-arm"/>
        <line x1="16" y1="-30" x2="30" y2="-10" stroke="#FDDCB5" stroke-width="8" stroke-linecap="round"/>
        <!-- Hand winkt -->
        <circle cx="-37" cy="-57" r="6" fill="#FDDCB5" class="wave-arm"/>
        <!-- Beine -->
        <line x1="-6" y1="-4" x2="-10" y2="25" stroke="#4a6fa5" stroke-width="8" stroke-linecap="round"/>
        <line x1="6" y1="-4" x2="10" y2="25" stroke="#4a6fa5" stroke-width="8" stroke-linecap="round"/>
        <!-- Schuhe -->
        <ellipse cx="-12" cy="27" rx="8" ry="4" fill="#8B5E3C"/>
        <ellipse cx="12" cy="27" rx="8" ry="4" fill="#8B5E3C"/>
      </g>
      <!-- Sparkles um Mila -->
      <circle cx="120" cy="80" r="3" fill="#ffd700" opacity="0.6" class="sparkle-1"/>
      <circle cx="280" cy="90" r="2.5" fill="#ffd700" opacity="0.5" class="sparkle-2"/>
      <circle cx="150" cy="200" r="2" fill="#ffd700" opacity="0.4" class="sparkle-3"/>
      <circle cx="260" cy="220" r="3" fill="#ffd700" opacity="0.5" class="sparkle-1"/>
    </svg>

    <!-- Fallback: Wald-Standard -->
    <svg v-else viewBox="0 0 400 300" class="scene-svg">
      <rect width="400" height="300" fill="#0f2318"/>
      <polygon points="50,300 80,120 110,300" fill="#2d6b3f" class="trees-front"/>
      <polygon points="150,300 190,90 230,300" fill="#267a3a" class="trees-front"/>
      <polygon points="280,300 310,130 340,300" fill="#2d6b3f" class="trees-front"/>
      <circle cx="350" cy="40" r="12" fill="#ffd700" opacity="0.6" class="sun-pulse"/>
    </svg>
  </div>
</template>

<script setup>
defineProps({
  scene: { type: String, default: 'forest-intro' }
})
</script>

<style scoped>
.scene-container { width: 100%; border-radius: 0.6rem; overflow: visible; position: relative; }
.scene-svg { width: 100%; height: auto; border-radius: 0.6rem; display: block; }

/* Mila bricht aus dem Rahmen heraus */
.mila-breakout { overflow: visible; }
.mila-breakout .mila-bounce {
  animation: milaBounce 2s ease-in-out infinite;
  transform-origin: center bottom;
}
@keyframes milaBounce {
  0%, 100% { transform: translate(200px, 150px) scale(1); }
  50% { transform: translate(200px, 140px) scale(1.03); }
}
.wave-arm { animation: waveHand 1s ease-in-out infinite; transform-origin: -16px -35px; }
@keyframes waveHand { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-15deg); } }

/* Mila läuft -->
.mila-walk { animation: milaWalkBounce 1.2s ease-in-out infinite; }
@keyframes milaWalkBounce {
  0%, 100% { transform: translate(185px, 230px); }
  50% { transform: translate(185px, 227px); }
}
.arm-swing { animation: armSwing 0.8s ease-in-out infinite; transform-origin: -6px -16px; }
.arm-swing-r { animation: armSwing 0.8s ease-in-out infinite reverse; transform-origin: 6px -16px; }
@keyframes armSwing { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } }
.leg-walk { animation: legWalk 0.8s ease-in-out infinite; transform-origin: -3px -4px; }
.leg-walk-r { animation: legWalk 0.8s ease-in-out infinite reverse; transform-origin: 3px -4px; }
@keyframes legWalk { 0%, 100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }
.hair-blow { animation: hairBlow 3s ease-in-out infinite; transform-origin: -8px -30px; }
@keyframes hairBlow { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(5deg); } }
.hair-blow-big { animation: hairBlow 3s ease-in-out infinite; }
.hair-blow-big-r { animation: hairBlow 3.5s ease-in-out infinite reverse; }

/* Bäume schwanken */
.trees-front { animation: treeSway 4s ease-in-out infinite; transform-origin: bottom center; }
.trees-back { animation: treeSway 5s ease-in-out infinite reverse; transform-origin: bottom center; }
@keyframes treeSway { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(1.02) translateX(2px); } }

/* Vögel fliegen */
.bird-fly { animation: birdFly 8s linear infinite; }
.bird-fly-2 { animation: birdFly 10s linear infinite 3s; }
@keyframes birdFly {
  0% { transform: translate(0, 0); }
  100% { transform: translate(200px, -30px); opacity: 0; }
}

/* Blätter fallen */
.leaf-fall-1 { animation: leafFall 6s ease-in-out infinite; }
.leaf-fall-2 { animation: leafFall 8s ease-in-out infinite 2s; }
.leaf-fall-3 { animation: leafFall 7s ease-in-out infinite 4s; }
@keyframes leafFall {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0.6; }
  100% { transform: translate(20px, 250px) rotate(360deg); opacity: 0; }
}

/* Sonne pulsiert */
.sun-pulse { animation: sunPulse 4s ease-in-out infinite; }
@keyframes sunPulse { 0%, 100% { r: 14; opacity: 0.9; } 50% { r: 16; opacity: 1; } }

/* Frosch hüpft */
.frog-hop { animation: frogHop 3s ease-in-out infinite; transform-origin: center bottom; }
@keyframes frogHop {
  0%, 70%, 100% { transform: translate(140px, 185px) scaleY(1); }
  80% { transform: translate(140px, 170px) scaleY(1.1); }
  90% { transform: translate(140px, 185px) scaleY(0.9); }
}

/* Wasser fließt */
.water-flow { animation: waterShift 3s ease-in-out infinite; }
@keyframes waterShift { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(5px); } }
.ripple-1 { animation: rippleMove 2s ease-in-out infinite; }
.ripple-2 { animation: rippleMove 2.5s ease-in-out infinite 0.5s; }
@keyframes rippleMove { 0%, 100% { transform: translateX(0); opacity: 0.3; } 50% { transform: translateX(8px); opacity: 0.15; } }

/* Fisch springt */
.fish-jump { animation: fishJump 4s ease-in-out infinite 2s; }
@keyframes fishJump {
  0%, 80%, 100% { transform: translate(0, 0); opacity: 0; }
  85% { transform: translate(0, -20px); opacity: 1; }
  95% { transform: translate(5px, -25px) rotate(-20deg); opacity: 1; }
}

/* Libelle */
.dragonfly { animation: dragonflyMove 6s ease-in-out infinite; }
@keyframes dragonflyMove {
  0%, 100% { transform: translate(200px, 120px); }
  25% { transform: translate(230px, 110px); }
  50% { transform: translate(180px, 100px); }
  75% { transform: translate(210px, 130px); }
}
.wing-flutter { animation: wingFlap 0.15s ease-in-out infinite alternate; transform-origin: center; }
@keyframes wingFlap { 0% { transform: scaleY(1); } 100% { transform: scaleY(0.3); } }

/* Haus-Effekte */
.window-glow { animation: windowFlicker 3s ease-in-out infinite; }
.window-glow-2 { animation: windowFlicker 3.5s ease-in-out infinite 1s; }
@keyframes windowFlicker { 0%, 100% { fill: #ffd080; } 50% { fill: #ffe0a0; } }
.door-light { animation: doorLightPulse 4s ease-in-out infinite; }
@keyframes doorLightPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.5; } }
.smoke-1 { animation: smokeRise 5s ease-out infinite; }
.smoke-2 { animation: smokeRise 6s ease-out infinite 1s; }
.smoke-3 { animation: smokeRise 7s ease-out infinite 2s; }
@keyframes smokeRise {
  0% { transform: translate(0, 0) scale(1); opacity: 0.15; }
  100% { transform: translate(-10px, -40px) scale(2); opacity: 0; }
}
.granny-silhouette { animation: grannyMove 5s ease-in-out infinite; }
@keyframes grannyMove { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(2px, 0); } }
.flowers-sway { animation: flowersSway 3s ease-in-out infinite; transform-origin: bottom; }
@keyframes flowersSway { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(2deg); } }
.star-twinkle { animation: twinkle 2s ease-in-out infinite; }
.star-twinkle-2 { animation: twinkle 3s ease-in-out infinite 1s; }
@keyframes twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
.warm-glow-big { animation: warmGlow 5s ease-in-out infinite; }
@keyframes warmGlow { 0%, 100% { opacity: 0.04; } 50% { opacity: 0.08; } }
.house-settle { animation: houseSettle 6s ease-in-out infinite; transform-origin: bottom; }
@keyframes houseSettle { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.003); } }

/* Sparkles */
.sparkle-1 { animation: sparkle 1.5s ease-in-out infinite; }
.sparkle-2 { animation: sparkle 2s ease-in-out infinite 0.5s; }
.sparkle-3 { animation: sparkle 1.8s ease-in-out infinite 1s; }
@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 0.8; transform: scale(1.3); }
}
</style>
