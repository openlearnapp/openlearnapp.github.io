<template>
  <Teleport to="body">
    <div class="trl-overlay" @click="onClose">
      <canvas ref="canvasEl" class="trl-canvas"></canvas>

      <!-- Text layers -->
      <div class="trl-ui" @click.stop>

        <!-- Scene 1: Teaser badge -->
        <div class="trl-scene" :class="{ 'trl-scene--in': scene >= 1, 'trl-scene--out': scene > 1 }">
          <div class="trl-badge">
            <span class="trl-badge-dot"></span>
            {{ isDE ? 'Linux · Workshop' : 'Linux · Workshop' }}
          </div>
        </div>

        <!-- Scene 2: Island builds + title -->
        <div class="trl-scene trl-scene--title" :class="{ 'trl-scene--in': scene >= 2, 'trl-scene--out': scene > 3 }">
          <h1 class="trl-title">Linux<br>Grundlagen</h1>
          <p class="trl-sub">{{ isDE ? 'Vom ersten Befehl zum Linux-Profi' : 'From first command to Linux pro' }}</p>
        </div>

        <!-- Scene 3: Stats -->
        <div class="trl-scene trl-scene--stats" :class="{ 'trl-scene--in': scene >= 3, 'trl-scene--out': scene > 4 }">
          <div class="trl-stats">
            <div class="trl-stat">
              <span class="trl-stat-n">12</span>
              <span class="trl-stat-l">{{ isDE ? 'Lektionen' : 'Lessons' }}</span>
            </div>
            <div class="trl-stat-sep"></div>
            <div class="trl-stat">
              <span class="trl-stat-n">48</span>
              <span class="trl-stat-l">{{ isDE ? 'Übungen' : 'Exercises' }}</span>
            </div>
            <div class="trl-stat-sep"></div>
            <div class="trl-stat">
              <span class="trl-stat-n">~4h</span>
              <span class="trl-stat-l">{{ isDE ? 'Lernzeit' : 'Learning time' }}</span>
            </div>
          </div>
        </div>

        <!-- Scene 4: Coming Soon -->
        <div class="trl-scene trl-scene--cs" :class="{ 'trl-scene--in': scene >= 4 }">
          <div class="trl-cs-wrap">
            <div class="trl-cs-glow"></div>
            <div class="trl-cs-label">{{ isDE ? 'BALD VERFÜGBAR' : 'COMING SOON' }}</div>
            <p class="trl-cs-sub">{{ isDE ? 'Das vollständige Video-Erlebnis' : 'The full video experience' }}</p>
            <button class="trl-cs-btn" @click="$emit('close')">
              {{ isDE ? '→ Jetzt mit Lektionen starten' : '→ Start with lessons now' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Close -->
      <button class="trl-close" @click.stop="$emit('close')" :aria-label="isDE ? 'Schließen' : 'Close'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  isDE:         { type: Boolean, default: true },
  workshopTitle:{ type: String,  default: 'Linux Grundlagen' },
})
defineEmits(['close'])

const canvasEl = ref(null)
const scene    = ref(0)

// ── Scene timeline ────────────────────────────────────────────────────────────
const SCENES = [
  { at: 400,  id: 1 },
  { at: 1800, id: 2 },
  { at: 3800, id: 3 },
  { at: 6000, id: 4 },
]
const timers = []
function startTimeline() {
  SCENES.forEach(s => {
    timers.push(setTimeout(() => { scene.value = s.id }, s.at))
  })
}

function onClose() { /* overlay click does nothing — only X button and CTA close */ }

// ── Canvas ────────────────────────────────────────────────────────────────────
let ctx, W, H, raf
let frame = 0

// Deterministic pseudo-random
function rand(seed) { return ((Math.sin(seed + 1) * 43758.5453) % 1 + 1) % 1 }

// ── Star field ────────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 120 }, (_, i) => ({
  x: rand(i * 3)     ,
  y: rand(i * 3 + 1) ,
  r: 0.5 + rand(i * 3 + 2) * 1.5,
  sp: 0.3 + rand(i * 5) * 0.7,
  ph: rand(i * 7) * Math.PI * 2,
}))

// ── Particles (code snippets) ─────────────────────────────────────────────────
const CMDS = ['ls -la','sudo','cd ~','chmod 755','grep','mkdir','echo $PATH','cat','|','>','ssh','apt','top','vim','kill','curl','tar -xzf','pwd']
const PARTS = Array.from({ length: 28 }, (_, i) => ({
  x: rand(i * 11)     ,
  y: rand(i * 11 + 1) ,
  vx: (rand(i * 13) - 0.5) * 0.0008,
  vy: -(0.0003 + rand(i * 17) * 0.0005),
  a: 0.15 + rand(i * 19) * 0.45,
  txt: CMDS[i % CMDS.length],
  sz: 10 + rand(i * 23) * 6,
  col: ['#10b981','#06b6d4','#a855f7','#f59e0b'][i % 4],
}))

// ── Isometric helpers ─────────────────────────────────────────────────────────
function isoProject(gx, gy, gz, cx, cy, tileX, tileY) {
  return {
    x: cx + (gx - gy) * tileX,
    y: cy + (gx + gy) * tileY * 0.5 - gz * tileY,
  }
}

function drawCube(x, y, z, w, h, d, top, left, right) {
  const T = 28, TX = 20
  const cx = W * 0.5, cy = H * 0.52

  const a = isoProject(x,   y,   z+d, cx, cy, T, TX)
  const b = isoProject(x+w, y,   z+d, cx, cy, T, TX)
  const c = isoProject(x+w, y+h, z+d, cx, cy, T, TX)
  const d_ = isoProject(x, y+h, z+d, cx, cy, T, TX)
  const e = isoProject(x,   y,   z,   cx, cy, T, TX)
  const f = isoProject(x+w, y,   z,   cx, cy, T, TX)
  const g = isoProject(x+w, y+h, z,   cx, cy, T, TX)

  // Top face
  ctx.beginPath()
  ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
  ctx.lineTo(c.x, c.y); ctx.lineTo(d_.x, d_.y)
  ctx.closePath(); ctx.fillStyle = top; ctx.fill()

  // Left face
  ctx.beginPath()
  ctx.moveTo(a.x, a.y); ctx.lineTo(d_.x, d_.y)
  ctx.lineTo(g.x, g.y); ctx.lineTo(isoProject(x, y+h, z, cx, cy, T, TX).x, isoProject(x, y+h, z, cx, cy, T, TX).y)
  ctx.closePath(); ctx.fillStyle = left; ctx.fill()

  // Right face
  ctx.beginPath()
  ctx.moveTo(b.x, b.y); ctx.lineTo(c.x, c.y)
  ctx.lineTo(g.x, g.y); ctx.lineTo(f.x, f.y)
  ctx.closePath(); ctx.fillStyle = right; ctx.fill()
}

// ── Island layout ─────────────────────────────────────────────────────────────
const ISLAND = [
  // Base platform
  { x:-3,y:-3,z:0,w:6,h:6,d:1,  top:'#1e3a5f',left:'#0f2040',right:'#162d4f' },
  { x:-2,y:-2,z:1,w:4,h:4,d:0.6,top:'#234876',left:'#152e52',right:'#1a3a60' },
  // Terminal block
  { x:-1,y:-1,z:1.6,w:2,h:2,d:1.2,top:'#0d1f3c',left:'#091729',right:'#0b1c34' },
  // Screen face (drawn separately as glowing rect)
]

// Screen face for terminal
function drawScreen(alpha) {
  const T = 28, TX = 20
  const cx = W * 0.5, cy = H * 0.52
  const x = -1, y = -1, z = 2.8, w = 2, d = 1.2

  const a = isoProject(x+w, y,   z+d, cx, cy, T, TX)
  const b = isoProject(x+w, y+d, z+d, cx, cy, T, TX)
  const c = isoProject(x+w, y+d, z,   cx, cy, T, TX)
  const f = isoProject(x+w, y,   z,   cx, cy, T, TX)

  // Glow behind screen
  const gx = (a.x + c.x) / 2
  const gy = (a.y + c.y) / 2
  const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, 60)
  gr.addColorStop(0, `rgba(16,185,129,${0.35 * alpha})`)
  gr.addColorStop(1, 'rgba(16,185,129,0)')
  ctx.fillStyle = gr
  ctx.beginPath(); ctx.arc(gx, gy, 60, 0, Math.PI * 2); ctx.fill()

  // Screen
  ctx.beginPath()
  ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
  ctx.lineTo(c.x, c.y); ctx.lineTo(f.x, f.y)
  ctx.closePath()

  const grad = ctx.createLinearGradient(f.x, f.y, a.x, a.y)
  grad.addColorStop(0, `rgba(8,30,20,${alpha})`)
  grad.addColorStop(1, `rgba(16,50,35,${alpha})`)
  ctx.fillStyle = grad; ctx.fill()

  // Scanlines
  ctx.strokeStyle = `rgba(16,185,129,${0.12 * alpha})`
  ctx.lineWidth = 1
  const steps = 8
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const px = f.x + (a.x - f.x) * t
    const py = f.y + (a.y - f.y) * t
    const qx = c.x + (b.x - c.x) * t
    const qy = c.y + (b.y - c.y) * t
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(qx, qy); ctx.stroke()
  }

  // Terminal text line
  const lx = (f.x + a.x) / 2 - 18
  const ly = (f.y + a.y + c.y + b.y) / 4
  const blink = Math.floor(frame / 30) % 2 === 0
  ctx.font = `bold 8px monospace`
  ctx.fillStyle = `rgba(74,222,128,${0.9 * alpha})`
  ctx.fillText(`$ _${blink ? '█' : ' '}`, lx, ly)
}

// ── Penguin (Tux) ─────────────────────────────────────────────────────────────
function drawPenguin(alpha) {
  const T = 28, TX = 20
  const cx = W * 0.5, cy = H * 0.52
  const pos = isoProject(-1.5, -1, 2.6, cx, cy, T, TX)
  const px = pos.x, py = pos.y
  const sc = Math.min(W, H) * 0.065
  const bob = Math.sin(frame * 0.04) * sc * 0.08

  ctx.save()
  ctx.translate(px, py + bob)
  ctx.scale(sc / 30, sc / 30)
  ctx.globalAlpha = alpha

  // Shadow
  ctx.beginPath()
  ctx.ellipse(0, 40, 22, 5, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill()

  // Body
  ctx.beginPath()
  ctx.ellipse(0, 10, 18, 24, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#1e293b'; ctx.fill()

  // Belly
  ctx.beginPath()
  ctx.ellipse(0, 14, 13, 19, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#f1f5f9'; ctx.fill()

  // Head
  ctx.beginPath()
  ctx.ellipse(0, -18, 16, 15, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#1e293b'; ctx.fill()

  // Eyes
  ;[[-7, -20], [7, -20]].forEach(([ex, ey]) => {
    ctx.beginPath(); ctx.ellipse(ex, ey, 5, 6, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'; ctx.fill()
    ctx.beginPath(); ctx.ellipse(ex + 1, ey + 1, 2.5, 2.5, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#0f172a'; ctx.fill()
    ctx.beginPath(); ctx.ellipse(ex - 0.5, ey - 1, 0.8, 0.8, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'; ctx.fill()
  })

  // Beak
  ctx.beginPath()
  ctx.moveTo(-4, -12); ctx.lineTo(0, -8); ctx.lineTo(4, -12); ctx.lineTo(0, -16)
  ctx.closePath(); ctx.fillStyle = '#fbbf24'; ctx.fill()

  // Flippers
  const flapL = Math.sin(frame * 0.08) * 8
  ctx.save(); ctx.rotate((-30 + flapL) * Math.PI / 180)
  ctx.beginPath(); ctx.ellipse(-20, 5, 6, 17, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#1e293b'; ctx.fill(); ctx.restore()

  ctx.save(); ctx.rotate((30 - flapL) * Math.PI / 180)
  ctx.beginPath(); ctx.ellipse(20, 5, 6, 17, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#1e293b'; ctx.fill(); ctx.restore()

  // Feet
  ;[[-7, 37], [7, 37]].forEach(([fx, fy]) => {
    ctx.beginPath(); ctx.ellipse(fx, fy, 8, 4, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#fbbf24'; ctx.fill()
  })

  ctx.restore()
}

// ── Aurora background ─────────────────────────────────────────────────────────
function drawAurora() {
  const t = frame * 0.008
  ;[
    { y: 0.25, amp: 0.06, col: [16, 185, 129], a: 0.18 },
    { y: 0.35, amp: 0.08, col: [168, 85, 246], a: 0.13 },
    { y: 0.3,  amp: 0.05, col: [6, 182, 212],  a: 0.12 },
  ].forEach(({ y, amp, col, a }) => {
    ctx.beginPath()
    ctx.moveTo(0, H * y)
    for (let x = 0; x <= W; x += 8) {
      const wave = Math.sin(x / W * Math.PI * 3 + t) * amp + Math.sin(x / W * Math.PI * 5 + t * 1.3) * amp * 0.5
      ctx.lineTo(x, H * (y + wave))
    }
    ctx.lineTo(W, H * 0.55); ctx.lineTo(0, H * 0.55); ctx.closePath()
    ctx.fillStyle = `rgba(${col.join(',')},${a})`; ctx.fill()
  })
}

// ── Main draw loop ────────────────────────────────────────────────────────────
function draw() {
  frame++
  ctx.clearRect(0, 0, W, H)

  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0,   '#040d1a')
  sky.addColorStop(0.5, '#07162e')
  sky.addColorStop(1,   '#0a1f3f')
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)

  // Aurora
  drawAurora()

  // Stars
  STARS.forEach(s => {
    const bri = 0.4 + Math.sin(frame * s.sp * 0.05 + s.ph) * 0.4
    ctx.beginPath()
    ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${bri})`; ctx.fill()
  })

  // Island build-up alpha: starts at frame 30 (~1s), fully visible by frame 90
  const islandAlpha = Math.min(1, Math.max(0, (frame - 30) / 60))

  if (islandAlpha > 0) {
    ctx.globalAlpha = islandAlpha
    ISLAND.forEach(b => drawCube(b.x, b.y, b.z, b.w, b.h, b.d, b.top, b.left, b.right))
    ctx.globalAlpha = 1
    drawScreen(islandAlpha)
    drawPenguin(islandAlpha)
  }

  // Floating code particles
  PARTS.forEach(p => {
    p.x = (p.x + p.vx + 1) % 1
    p.y = (p.y + p.vy + 1) % 1
    ctx.font = `${p.sz}px monospace`
    ctx.fillStyle = p.col
    ctx.globalAlpha = p.a * Math.max(0.3, islandAlpha)
    ctx.fillText(p.txt, p.x * W, p.y * H)
    ctx.globalAlpha = 1
  })

  // Ground glow
  const gnd = ctx.createRadialGradient(W * 0.5, H * 0.65, 0, W * 0.5, H * 0.65, W * 0.4)
  gnd.addColorStop(0, `rgba(16,185,129,${0.12 * islandAlpha})`)
  gnd.addColorStop(1, 'rgba(16,185,129,0)')
  ctx.fillStyle = gnd; ctx.fillRect(0, H * 0.4, W, H * 0.6)

  raf = requestAnimationFrame(draw)
}

function resize() {
  if (!canvasEl.value) return
  W = canvasEl.value.width  = canvasEl.value.offsetWidth
  H = canvasEl.value.height = canvasEl.value.offsetHeight
}

onMounted(() => {
  ctx = canvasEl.value.getContext('2d')
  resize()
  window.addEventListener('resize', resize)
  draw()
  startTimeline()
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
  timers.forEach(clearTimeout)
})
</script>

<style scoped>
/* ── Overlay ── */
.trl-overlay {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  background: rgba(2,8,20,0.96);
  backdrop-filter: blur(8px);
}
.trl-canvas {
  position: absolute; inset: 0; width: 100%; height: 100%;
}

/* ── UI layer ── */
.trl-ui {
  position: relative; z-index: 2;
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none;
}

/* ── Scenes ── */
.trl-scene {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity .7s ease, transform .7s ease;
  pointer-events: none;
}
.trl-scene--in  { opacity: 1; transform: none; }
.trl-scene--out { opacity: 0; transform: translateY(-12px); transition-duration: .5s; }
.trl-scene--cs  { pointer-events: auto; }

/* Scene 1: Badge */
.trl-badge {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 20px; border-radius: 100px;
  background: rgba(16,185,129,0.12);
  border: 1px solid rgba(16,185,129,0.35);
  font-size: 12px; font-weight: 800; letter-spacing: .12em;
  text-transform: uppercase; color: #10b981;
}
.trl-badge-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: trl-pulse 1.5s ease-in-out infinite;
}
@keyframes trl-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }

/* Scene 2: Title */
.trl-scene--title { top: auto; bottom: 12%; height: auto; justify-content: flex-end; }
.trl-title {
  font-size: clamp(44px, 10vw, 96px); font-weight: 900; line-height: 1.0;
  text-align: center; color: #fff;
  text-shadow: 0 0 60px rgba(16,185,129,0.5), 0 4px 32px rgba(0,0,0,0.6);
  letter-spacing: -.02em;
}
.trl-sub {
  margin-top: 12px; font-size: clamp(13px, 2.5vw, 18px);
  color: rgba(148,213,255,0.75); text-align: center;
  letter-spacing: .02em;
}

/* Scene 3: Stats */
.trl-scene--stats { top: auto; bottom: 6%; height: auto; justify-content: flex-end; }
.trl-stats {
  display: flex; align-items: center; gap: 24px;
  padding: 14px 28px; border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(4px);
}
.trl-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.trl-stat-n {
  font-size: clamp(20px, 4vw, 32px); font-weight: 900; color: #10b981;
  line-height: 1; font-variant-numeric: tabular-nums;
}
.trl-stat-l { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.45); letter-spacing: .06em; text-transform: uppercase; }
.trl-stat-sep { width: 1px; height: 36px; background: rgba(255,255,255,0.1); }

/* Scene 4: Coming Soon */
.trl-scene--cs { background: linear-gradient(to top, rgba(2,8,20,0.85), transparent 60%); }
.trl-cs-wrap {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 40px 32px; max-width: 480px; text-align: center; position: relative;
}
.trl-cs-glow {
  position: absolute; inset: 0; border-radius: 24px;
  box-shadow: 0 0 80px rgba(16,185,129,0.25), inset 0 0 40px rgba(16,185,129,0.06);
  border: 1px solid rgba(16,185,129,0.2);
  animation: trl-cs-glow 3s ease-in-out infinite;
}
@keyframes trl-cs-glow {
  0%,100% { box-shadow: 0 0 60px rgba(16,185,129,0.2), inset 0 0 30px rgba(16,185,129,0.05); }
  50%     { box-shadow: 0 0 120px rgba(16,185,129,0.35), inset 0 0 60px rgba(16,185,129,0.1); }
}
.trl-cs-label {
  font-size: clamp(28px, 7vw, 56px); font-weight: 900;
  letter-spacing: .06em; color: #fff;
  text-shadow: 0 0 40px rgba(16,185,129,0.6);
  position: relative;
}
.trl-cs-sub {
  font-size: 15px; color: rgba(148,213,255,0.7);
  position: relative;
}
.trl-cs-btn {
  margin-top: 8px; padding: 14px 28px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff; font-size: 15px; font-weight: 800;
  cursor: pointer; pointer-events: auto;
  box-shadow: 0 8px 32px rgba(16,185,129,0.45);
  transition: transform .15s, box-shadow .15s;
  position: relative;
}
.trl-cs-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(16,185,129,0.55); }
.trl-cs-btn:active { transform: translateY(0); }

/* ── Close button ── */
.trl-close {
  position: absolute; top: 20px; right: 20px; z-index: 3;
  width: 40px; height: 40px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background .2s, color .2s;
}
.trl-close:hover { background: rgba(255,255,255,0.18); color: #fff; }
</style>
