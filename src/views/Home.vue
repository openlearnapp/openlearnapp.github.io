<template>
  <div class="home-root" @click="showLanguageMenu && (showLanguageMenu = false)">

    <!-- ═══════ HERO ═══════ -->
    <section class="hero">
      <canvas ref="bgCanvas" class="hero-bg" aria-hidden="true" />
      <div class="hero-overlay" />

      <div class="hero-inner">

        <!-- Left: text + CTA -->
        <div class="hero-left">
          <div class="hero-pill">🎓 Open Learn</div>
          <h1 class="hero-h1">{{ $t('home.title') }}</h1>
          <p class="hero-p">{{ $t('home.subtitle') }}</p>

          <!-- Style switcher — switches ALL quiz cards live -->
          <div class="style-bar">
            <button v-for="s in STYLES" :key="s"
              class="sty-btn" :class="{ on: activeStyle === s }"
              @click.stop="setStyle(s)">{{ s }}</button>
          </div>

          <!-- Language selector -->
          <div class="hero-cta" @click.stop>
            <div class="lang-selector-wrap">
              <button class="lang-btn" @click.stop="showLanguageMenu = !showLanguageMenu" aria-haspopup="listbox">
                <span class="lang-flag">{{ getFlag(currentLanguage) }}</span>
                <span class="lang-name">{{ formatLangName(currentLanguage) }}</span>
                <svg class="lang-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              <Transition name="lang-drop">
                <div v-if="showLanguageMenu" class="lang-menu" role="listbox">
                  <button v-for="lang in learningLanguages" :key="lang"
                    class="lang-option" :class="{ active: currentLanguage === lang }"
                    @click="selectLanguage(lang)">
                    <span>{{ getFlag(lang) }}</span>
                    <span>{{ formatLangName(lang) }}</span>
                  </button>
                </div>
              </Transition>
            </div>
            <button class="start-btn" @click="goToWorkshops(currentLanguage)">
              {{ $t('home.browseWorkshops') }}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
          </div>

          <div class="skill-tag">quiz-scenes skill · plugin-workshop-creator PR #15</div>
        </div>

        <!-- Right: interactive quiz demo -->
        <div class="hero-right">
          <div class="demo-card">
            <div class="demo-header">
              <span class="demo-label">{{ heroQ.sub }}</span>
              <span class="demo-word">{{ heroQ.q }}</span>
            </div>
            <div class="demo-grid">
              <div v-for="(c, i) in heroQ.choices" :key="i"
                class="choice-cell"
                :class="{
                  ok:  heroAnswered && i === heroQ.ans,
                  no:  heroAnswered && heroChosen === i && i !== heroQ.ans,
                  dim: heroAnswered && i !== heroQ.ans && heroChosen !== i
                }"
                @click="answerHero(i)">
                <canvas :ref="el => setHeroCanvas(el, i, c.s)" class="choice-canvas" />
                <div class="choice-label-row">
                  <span class="choice-word">{{ c.w }}</span>
                  <span v-if="heroAnswered && i === heroQ.ans" class="badge-ok">✓</span>
                  <span v-else-if="heroAnswered && heroChosen === i" class="badge-no">✕</span>
                </div>
              </div>
            </div>
            <button v-if="heroAnswered" class="next-btn" @click="nextHeroQ">
              {{ $t('lesson.nextLesson') }} →
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ SCENE GALLERY — alle 6 Atmosphären ═══════ -->
    <section class="gallery-sec">
      <div class="sec-inner">
        <div class="sec-tag">6 Atmosphären — automatisch aus Workshop-Inhalt erkannt</div>
        <h2 class="sec-h2">Jede Antwort bekommt eine passende Szene</h2>
        <p class="sec-p">
          „Hola" → sonniger Platz · „Gute Nacht" → Mondlicht · „Lo siento" → Regen<br>
          Der Skill liest dein YAML und wählt automatisch die passende Atmosphäre.
        </p>
        <div class="scene-gallery">
          <div v-for="s in LANG_SCENES" :key="s.key" class="scene-tile">
            <canvas :ref="el => registerGallery(el, s.key)" class="scene-canvas" />
            <span class="scene-label">{{ s.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ STYLE COMPARISON — 3 Stile gleichzeitig ═══════ -->
    <section class="compare-sec">
      <div class="sec-inner">
        <div class="sec-tag">Ein Klick — drei Looks</div>
        <h2 class="sec-h2">Cinematic · Neon · Minimal</h2>
        <p class="sec-p">
          Dieselbe Szene, drei komplett verschiedene Rendering-Stile.<br>
          Oben im Style-Switcher umschalten — alle Karten wechseln sofort.
        </p>
        <div class="compare-row">
          <div v-for="s in STYLES" :key="s" class="compare-tile"
            :class="{ active: activeStyle === s }" @click="setStyle(s)">
            <canvas :ref="el => registerComp(el, 'night', s)" class="comp-canvas" />
            <div class="comp-footer">
              <span class="comp-name">{{ s }}</span>
              <span v-if="activeStyle === s" class="comp-active">← aktiv</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ IT / TECH SCENES ═══════ -->
    <section class="tech-sec">
      <div class="sec-inner">
        <div class="sec-tag">Nicht nur Sprachen</div>
        <h2 class="sec-h2">IT-Workshops bekommen Terminal-Szenen</h2>
        <p class="sec-p">
          Der Skill erkennt Linux-Befehle, Git, Docker — und zeichnet animierte Terminal-Karten.
        </p>
        <div class="tech-row">
          <div v-for="s in TECH_SCENES" :key="s.key" class="tech-tile">
            <canvas :ref="el => registerTech(el, s.key)" class="tech-canvas" />
            <span class="scene-label">{{ s.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ HOW IT WORKS ═══════ -->
    <section class="how-sec">
      <div class="sec-inner">
        <h2 class="sec-h2">{{ $t('home.howItWorks') }}</h2>
        <div class="steps-row">
          <div v-for="(step, i) in steps" :key="i" class="step-card">
            <div class="step-num">{{ i + 1 }}</div>
            <div class="step-title">{{ step.title }}</div>
            <div class="step-desc">{{ step.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ OPEN SOURCE CTA ═══════ -->
    <section class="cta-sec">
      <div class="sec-inner cta-inner">
        <h2 class="cta-h2">{{ $t('home.openSourceTitle') }}</h2>
        <p class="cta-p">{{ $t('home.openSourceDesc') }}</p>
        <div class="cta-btns">
          <a href="https://github.com/openlearnapp/openlearnapp.github.io"
            target="_blank" rel="noopener" class="btn-primary">
            {{ $t('home.viewOnGitHub') }}
          </a>
          <a href="#/creators" class="btn-ghost">{{ $t('home.forCreatorsLink') }}</a>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLessons } from '../composables/useLessons'
import { useLanguage } from '../composables/useLanguage'
import { formatLangName } from '../utils/formatters'

const router = useRouter()
const { t } = useI18n()
const { availableContent, loadAvailableContent } = useLessons()
const { selectedLanguage, getFlag, setLanguage } = useLanguage()

// ─── Language selector ──────────────────────────────────────────────
const showLanguageMenu = ref(false)
const learningLanguages = computed(() => [...new Set(Object.keys(availableContent.value))])
const currentLanguage  = computed(() => selectedLanguage.value || learningLanguages.value[0] || 'english')

function selectLanguage(lang) { showLanguageMenu.value = false; setLanguage(lang) }
function goToWorkshops(lang)  { setLanguage(lang); router.push({ name: 'workshop-overview', params: { learning: lang } }) }

// ─── How it works ───────────────────────────────────────────────────
const steps = computed(() => [
  { title: t('home.steps.pickLang'),      desc: t('home.steps.pickLangDesc') },
  { title: t('home.steps.startWorkshop'), desc: t('home.steps.startWorkshopDesc') },
  { title: t('home.steps.learnTrack'),    desc: t('home.steps.learnTrackDesc') },
])

// ═══════════════════════════════════════════════════════════════════
// SCENE DATA — ported from experiments/18-multi-style-quiz
// ═══════════════════════════════════════════════════════════════════
const STYLES = ['cinematic', 'neon', 'minimal']
const activeStyle = ref('cinematic')
function setStyle(s) { activeStyle.value = s }

const LANG_SCENES = [
  { key: 'plaza_day',   label: 'Hallo / Hello / سلام' },
  { key: 'golden_room', label: 'Danke / Thank you / ممنون' },
  { key: 'sunrise',     label: 'Guten Morgen / صبح بخیر' },
  { key: 'rainy',       label: 'Entschuldigung / Lo siento' },
  { key: 'night',       label: 'Gute Nacht / شب بخیر' },
  { key: 'park_sunset', label: 'Tschüss / Adiós / خداحافظ' },
]

const TECH_SCENES = [
  { key: 'tech_list',   label: 'ls -la  — Dateien anzeigen' },
  { key: 'tech_cd',     label: 'cd ..   — Ordner wechseln' },
  { key: 'tech_delete', label: 'rm -rf  — Löschen (Vorsicht!)' },
]

const CFG = {
  plaza_day:   { sky:['#5DADE2','#F0A500'], sky2:'#FFB347', ground:'#C8956A',  pose:'wave',    neon:'#00FF99', min:'#FFF0E0', minFig:'#E74C3C', fig:{skin:'#F4A070',hair:'#3D2514',shirt:'#2E86AB',pants:'#2C3A50',shoe:'#1A1A2E'} },
  golden_room: { sky:['#E8C46A','#FF8C00'], sky2:'#FFAA00', ground:'#8B6914',  pose:'bow',     neon:'#FFD700', min:'#FFF8E1', minFig:'#E67E22', fig:{skin:'#D4916A',hair:'#1A0A00',shirt:'#D4AC0D',pants:'#5C3D1E',shoe:'#2E1A0E'} },
  sunrise:     { sky:['#C0392B','#F39C12'], sky2:'#FF6B9D', ground:'#4A3728',  pose:'stretch', neon:'#FF6B9D', min:'#FDE8F0', minFig:'#8E44AD', fig:{skin:'#F4A070',hair:'#5C3D1E',shirt:'#E74C3C',pants:'#4A5568',shoe:'#2C3040'} },
  rainy:       { sky:['#5D6D7E','#2C3E50'], sky2:'#607D8B', ground:'#2C3A4A',  pose:'sad',     neon:'#4444FF', min:'#E8EEF4', minFig:'#2980B9', fig:{skin:'#B08068',hair:'#2D1B00',shirt:'#5D6D7E',pants:'#37474F',shoe:'#263238'} },
  night:       { sky:['#0A0F1E','#0D1B2A'], sky2:'#0D1B2A', ground:'#06080F', pose:'gaze',    neon:'#AA44FF', min:'#E8E0F4', minFig:'#6C3483', fig:{skin:'#C4866A',hair:'#1A0800',shirt:'#1A237E',pants:'#0D1B2A',shoe:'#050A10'} },
  park_sunset: { sky:['#C0392B','#E67E22'], sky2:'#FF5733', ground:'#2D4A1E',  pose:'wave2',   neon:'#FF4444', min:'#FFF0E8', minFig:'#C0392B', fig:{skin:'#E8906A',hair:'#2D1B00',shirt:'#E74C3C',pants:'#1C2833',shoe:'#1A1A2E'} },
  tech_list:   { tech:true, cmd:'ls -la',   desc:'Alle Dateien', col:'#00FF41' },
  tech_cd:     { tech:true, cmd:'cd ..',    desc:'Hoch',         col:'#00AAFF' },
  tech_delete: { tech:true, cmd:'rm -rf',   desc:'Löschen!',     col:'#FF5555' },
}

const POSES = {
  wave:    { aL:-82, aR:118, tor:0,   hd:6,   lL:-3, lR:3,  wa:true  },
  bow:     { aL:-25, aR:-25, tor:-30, hd:25,  lL:0,  lR:0,  wa:false },
  stretch: { aL:108, aR:108, tor:0,   hd:-18, lL:-5, lR:5,  wa:false },
  sad:     { aL:-70, aR:-70, tor:12,  hd:28,  lL:0,  lR:0,  wa:false },
  gaze:    { aL:-72, aR:-72, tor:0,   hd:-40, lL:5,  lR:-5, wa:false },
  wave2:   { aL:-80, aR:108, tor:4,   hd:8,   lL:12, lR:-3, wa:true  },
}

// Pre-computed static data (no new Random() per frame)
const STARS  = Array.from({length:60}, () => ({x:Math.random(),y:Math.random()*.7,r:.5+Math.random()*1.8,ph:Math.random()*6,sp:.4+Math.random()*1.6}))
const RAIN   = Array.from({length:60}, () => ({x:Math.random(),y:Math.random(),len:.05+Math.random()*.05,sp:3+Math.random()*2}))
const PETALS = Array.from({length:20}, () => ({x:Math.random(),y:Math.random(),vx:-.003-.002*Math.random(),vy:.0015+.002*Math.random(),r:3+Math.random()*4}))
const BLDG_W = [{x:.04,w:.09,h:.30},{x:.15,w:.07,h:.38},{x:.23,w:.05,h:.24},{x:.66,w:.10,h:.40},{x:.78,w:.07,h:.28},{x:.87,w:.09,h:.34}]
const TREES  = [[.09,.28,.30],[.78,.32,.26],[.88,.20,.18]]

function R(d) { return d * Math.PI / 180 }

// ─── Drawing primitives (from experiments/18 + quiz-scenes PR #15) ──
function drawTaperedLimb(ctx, x1, y1, x2, y2, w1, w2, col) {
  const dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy); if(len<1) return
  const nx=dy/len, ny=-dx/len
  ctx.beginPath()
  ctx.moveTo(x1+nx*w1, y1+ny*w1)
  ctx.bezierCurveTo((x1*2+x2)/3+nx*(w1*.6+w2*.4),(y1*2+y2)/3+ny*(w1*.6+w2*.4),(x1+x2*2)/3+nx*(w1*.4+w2*.6),(y1+y2*2)/3+ny*(w1*.4+w2*.6),x2+nx*w2,y2+ny*w2)
  ctx.lineTo(x2-nx*w2, y2-ny*w2)
  ctx.bezierCurveTo((x1+x2*2)/3-nx*(w1*.4+w2*.6),(y1+y2*2)/3-ny*(w1*.4+w2*.6),(x1*2+x2)/3-nx*(w1*.6+w2*.4),(y1*2+y2)/3-ny*(w1*.6+w2*.4),x1-nx*w1,y1-ny*w1)
  ctx.closePath(); ctx.fillStyle=col; ctx.fill()
}

function drawFigure(ctx, cx, by, h, pKey, col, t, glow) {
  const P=POSES[pKey]||POSES.wave, u=h/160
  const breath=Math.sin(t*1.1)*h*.004, swy=Math.sin(t*.65)*h*.0025
  const wv=P.wa ? Math.sin(t*2.8)*.2 : 0
  const hipY=by-82*u+breath, shY=by-122*u+breath, hdCY=by-147*u+breath
  const sLX=cx-14*u+swy, sRX=cx+14*u+swy, hLX=cx-10*u, hRX=cx+10*u

  if (!glow) {
    const sg=ctx.createRadialGradient(cx+swy,by,0,cx+swy,by,22*u)
    sg.addColorStop(0,'rgba(0,0,0,.3)'); sg.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle=sg; ctx.beginPath(); ctx.ellipse(cx+swy,by,22*u,6*u,0,0,Math.PI*2); ctx.fill()
  }

  function limb(x1,y1,x2,y2,w1,w2,c) {
    if (glow) {
      ctx.shadowBlur=15; ctx.shadowColor=c; ctx.strokeStyle=c
      ctx.lineWidth=w1*1.2; ctx.lineCap='round'
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.shadowBlur=0
    } else { drawTaperedLimb(ctx,x1,y1,x2,y2,w1,w2,c) }
  }

  const aLr=R(P.aL-90), eLX=sLX+Math.cos(aLr)*24*u, eLY=shY+Math.sin(aLr)*24*u
  limb(sLX,shY,eLX,eLY,5.5*u,4.5*u,col.skin)
  limb(eLX,eLY,eLX+Math.cos(aLr+.28)*19*u,eLY+Math.sin(aLr+.28)*19*u,4.5*u,3.5*u,col.skin)

  const lLr=R(P.lL-90), lRr=R(P.lR-90)
  const kLX=hLX+Math.cos(lLr)*30*u, kLY=hipY+Math.sin(lLr)*30*u
  const kRX=hRX+Math.cos(lRr)*30*u, kRY=hipY+Math.sin(lRr)*30*u
  limb(hLX,hipY,kLX,kLY,8*u,6.5*u,col.pants)
  limb(kLX,kLY,kLX+Math.cos(lLr+.1)*26*u,kLY+Math.sin(lLr+.1)*26*u,6.5*u,5*u,col.pants)
  limb(hRX,hipY,kRX,kRY,8*u,6.5*u,col.pants)
  limb(kRX,kRY,kRX+Math.cos(lRr-.1)*26*u,kRY+Math.sin(lRr-.1)*26*u,6.5*u,5*u,col.pants)

  if (glow) {
    ctx.shadowBlur=12; ctx.shadowColor=col.shirt; ctx.strokeStyle=col.shirt
    ctx.lineWidth=10*u; ctx.lineCap='round'
    ctx.beginPath(); ctx.moveTo(sLX,shY); ctx.lineTo(sRX,shY)
    ctx.moveTo(hLX,hipY); ctx.lineTo(hRX,hipY); ctx.stroke(); ctx.shadowBlur=0
  } else {
    ctx.beginPath()
    ctx.moveTo(sLX-1.5*u,shY)
    ctx.bezierCurveTo(sLX-2*u,shY+20*u,hLX-1*u,hipY-10*u,hLX,hipY)
    ctx.lineTo(hRX,hipY)
    ctx.bezierCurveTo(hRX+1*u,hipY-10*u,sRX+2*u,shY+20*u,sRX+1.5*u,shY)
    ctx.closePath(); ctx.fillStyle=col.shirt; ctx.fill()
  }

  limb(cx+swy,shY,cx+swy,by-132*u+breath,6*u,5*u,col.skin)

  const aRr=R(P.aR-90), eRX=sRX+Math.cos(aRr)*24*u, eRY=shY+Math.sin(aRr+wv)*.88*24*u
  limb(sRX,shY,eRX,eRY,5.5*u,4.5*u,col.skin)
  limb(eRX,eRY,eRX+Math.cos(aRr-.3+wv*.5)*19*u,eRY+Math.sin(aRr-.3+wv*.5)*19*u,4.5*u,3.5*u,col.skin)

  const hR=11*u, htilt=R(P.hd)*.4
  ctx.save(); ctx.translate(cx+swy,hdCY); ctx.rotate(htilt)
  if (glow) {
    ctx.shadowBlur=20; ctx.shadowColor=col.skin
    ctx.fillStyle=col.skin; ctx.beginPath(); ctx.arc(0,0,hR,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0
  } else {
    ctx.fillStyle=col.skin; ctx.beginPath(); ctx.arc(0,0,hR,0,Math.PI*2); ctx.fill()
    ctx.fillStyle=col.hair; ctx.beginPath(); ctx.arc(0,-hR*.1,hR,Math.PI,Math.PI*2); ctx.fill()
    const blink = Math.sin(t*.3) > .97 ? 0 : 1
    ctx.fillStyle='#1A1A2E'
    for (const ex of [-hR*.3, hR*.3]) {
      ctx.beginPath()
      if (blink) ctx.arc(ex,hR*.1,hR*.13,0,Math.PI*2)
      else ctx.ellipse(ex,hR*.1,hR*.13,hR*.04,0,0,Math.PI*2)
      ctx.fill()
    }
    ctx.fillStyle='#FF8A80'; ctx.beginPath(); ctx.arc(0,hR*.3,hR*.25,0,Math.PI); ctx.fill()
  }
  ctx.restore()
}

// ─── Cinematic renderer ─────────────────────────────────────────────
function renderCinematic(ctx, w, h, key, t) {
  const c=CFG[key]; if(!c) return
  if (c.tech) { renderTech(ctx,w,h,c,t,'cinematic'); return }
  const gy=h*.72
  const sk=ctx.createLinearGradient(0,0,0,gy)
  sk.addColorStop(0,c.sky[0]); sk.addColorStop(1,c.sky[1])
  ctx.fillStyle=sk; ctx.fillRect(0,0,w,gy)
  ctx.fillStyle=c.ground; ctx.fillRect(0,gy,w,h-gy)

  if (key==='night'||key==='rainy') {
    STARS.forEach(s=>{
      const a = key==='night' ? (.4+.6*Math.sin(t*s.sp+s.ph)) : (.15+.1*Math.sin(t*s.sp+s.ph))
      ctx.globalAlpha=a; ctx.fillStyle='#fff'
      ctx.beginPath(); ctx.arc(w*s.x,h*s.y,s.r,0,Math.PI*2); ctx.fill()
    }); ctx.globalAlpha=1
  }
  if (key==='plaza_day'||key==='park_sunset') {
    BLDG_W.forEach(b=>{
      ctx.fillStyle='rgba(0,0,0,.18)'
      ctx.fillRect(w*b.x,gy-h*b.h,w*b.w,h*b.h)
    })
  }
  if (key==='sunrise'||key==='park_sunset'||key==='plaza_day') {
    TREES.forEach(([tx,tw,th])=>{
      ctx.fillStyle='rgba(0,0,0,.28)'
      ctx.beginPath(); ctx.moveTo(w*tx,gy-h*th); ctx.lineTo(w*tx-w*tw/2,gy); ctx.lineTo(w*tx+w*tw/2,gy); ctx.closePath(); ctx.fill()
    })
  }
  if (key==='rainy') {
    ctx.strokeStyle='rgba(180,200,255,.18)'; ctx.lineWidth=.8
    RAIN.forEach(r=>{
      const dy=(t*r.sp*.015)%1, ry=((r.y+dy)%1)*h
      ctx.beginPath(); ctx.moveTo(w*r.x,ry); ctx.lineTo(w*r.x-2,ry+h*r.len); ctx.stroke()
    })
  }
  if (key==='park_sunset') {
    PETALS.forEach(p=>{
      const ddx=(t*.003*300*Math.abs(p.vx||.002))%1, ddy=(t*.003*300*Math.abs(p.vy||.002))%1
      ctx.globalAlpha=.5; ctx.fillStyle='#FFAB91'
      ctx.beginPath(); ctx.arc(((p.x+ddx)%1)*w,((p.y+ddy)%1)*h,p.r,0,Math.PI*2); ctx.fill()
    }); ctx.globalAlpha=1
  }
  drawFigure(ctx,w*.5,h*.86,h*.52,c.pose,c.fig,t,false)
  // Film grain
  ctx.globalAlpha=.04
  const id=ctx.createImageData(w,h)
  for(let i=0;i<id.data.length;i+=4){const n=(Math.random()*255)|0;id.data[i]=id.data[i+1]=id.data[i+2]=n;id.data[i+3]=255}
  ctx.putImageData(id,0,0); ctx.globalAlpha=1
  // Vignette
  const vg=ctx.createRadialGradient(w*.5,h*.5,h*.2,w*.5,h*.5,h*.75)
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.55)')
  ctx.fillStyle=vg; ctx.fillRect(0,0,w,h)
}

// ─── Neon renderer ──────────────────────────────────────────────────
function renderNeon(ctx, w, h, key, t) {
  const c=CFG[key]; if(!c) return
  if (c.tech) { renderTech(ctx,w,h,c,t,'neon'); return }
  const nCol=c.neon||'#00FF99'
  ctx.fillStyle='#04040C'; ctx.fillRect(0,0,w,h)
  // Scanlines
  ctx.globalAlpha=.03; for(let y=0;y<h;y+=3){ctx.fillStyle='#000';ctx.fillRect(0,y,w,1)} ctx.globalAlpha=1
  // Perspective grid
  const vx=w*.5, vy=h*.62
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=nCol+'40'; ctx.lineWidth=.8
  for(let i=0;i<8;i++){const yy=vy+(h-vy)*((i/8)**1.8);ctx.globalAlpha=.3*(1-i/8);ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(w,yy);ctx.stroke()}
  for(let i=-8;i<=8;i++){ctx.globalAlpha=.2;ctx.beginPath();ctx.moveTo(vx+i*w*.14,h);ctx.lineTo(vx,vy);ctx.stroke()}
  ctx.globalAlpha=1; ctx.restore()
  // Horizon glow
  const hg=ctx.createRadialGradient(w*.5,h*.62,0,w*.5,h*.62,w*.6)
  hg.addColorStop(0,nCol+'30'); hg.addColorStop(1,'rgba(0,0,0,0)')
  ctx.fillStyle=hg; ctx.fillRect(0,0,w,h)
  // Scene-specific neon elements
  ctx.save(); ctx.globalCompositeOperation='lighter'
  if(key==='plaza_day'){for(let i=0;i<4;i++){const r=20+i*18+Math.sin(t*1.5+i*.8)*5;ctx.strokeStyle=nCol;ctx.lineWidth=1.5;ctx.globalAlpha=.35-i*.07;ctx.beginPath();ctx.arc(w*.5,h*.45,r,0,Math.PI*2);ctx.stroke()}}
  else if(key==='night'){STARS.slice(0,20).forEach(s=>{const a=.5+.5*Math.sin(t*s.sp+s.ph);ctx.fillStyle=nCol;ctx.globalAlpha=a*.4;ctx.shadowBlur=8;ctx.shadowColor=nCol;ctx.beginPath();ctx.arc(w*s.x,h*s.y,s.r*.7,0,Math.PI*2);ctx.fill()});ctx.shadowBlur=0}
  else if(key==='rainy'){ctx.strokeStyle=nCol;ctx.lineWidth=.8;RAIN.slice(0,30).forEach(r=>{const dy=(t*r.sp*.015)%1,ry=((r.y+dy)%1)*h;ctx.globalAlpha=.15;ctx.beginPath();ctx.moveTo(w*r.x,ry);ctx.lineTo(w*r.x-2,ry+h*r.len*.7);ctx.stroke()})}
  else if(key==='golden_room'){for(let i=0;i<12;i++){const ang=(i/12)*Math.PI*2+t*.05,rl=h*.25+Math.sin(t*1.2+i)*.04*h;ctx.strokeStyle=nCol;ctx.lineWidth=1;ctx.globalAlpha=.2+.05*Math.sin(t*2+i);ctx.beginPath();ctx.moveTo(w*.5,h*.4);ctx.lineTo(w*.5+Math.cos(ang)*rl,h*.4+Math.sin(ang)*rl);ctx.stroke()}}
  else if(key==='park_sunset'){PETALS.slice(0,10).forEach(p=>{const ddx=(t*.003*300*Math.abs(p.vx||.002))%1,ddy=(t*.003*300*Math.abs(p.vy||.002))%1;ctx.fillStyle=nCol;ctx.globalAlpha=.12;ctx.shadowBlur=10;ctx.shadowColor=nCol;ctx.beginPath();ctx.arc(((p.x+ddx)%1)*w,((p.y+ddy)%1)*h,4,0,Math.PI*2);ctx.fill()});ctx.shadowBlur=0}
  ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; ctx.restore()
  // Neon figure
  const glowCol={skin:nCol,hair:nCol,shirt:nCol+'CC',pants:nCol+'AA',shoe:nCol+'88'}
  drawFigure(ctx,w*.5,h*.84,h*.5,c.pose,glowCol,t,true)
  // Vignette
  const vg=ctx.createRadialGradient(w*.5,h*.5,h*.25,w*.5,h*.5,h*.8)
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.6)')
  ctx.fillStyle=vg; ctx.fillRect(0,0,w,h)
  ctx.strokeStyle=nCol+'33'; ctx.lineWidth=1.5; ctx.strokeRect(3,3,w-6,h-6)
}

// ─── Minimal renderer ───────────────────────────────────────────────
function renderMinimal(ctx, w, h, key, t) {
  const c=CFG[key]; if(!c) return
  if (c.tech) { renderTech(ctx,w,h,c,t,'minimal'); return }
  ctx.fillStyle=c.min||'#F5F0E8'; ctx.fillRect(0,0,w,h)
  const gy=h*.72
  ctx.fillStyle=c.sky[0]+'22'; ctx.fillRect(0,0,w,gy)
  ctx.fillStyle=c.sky[1]+'18'; ctx.fillRect(0,gy,w,h-gy)
  if(key==='plaza_day'){ctx.beginPath();ctx.arc(w*.78,h*.2,22,0,Math.PI*2);ctx.fillStyle=c.sky[1]+'CC';ctx.fill();ctx.fillStyle=c.sky[0]+'44';[[.06,.22,.32],[.18,.16,.40],[.68,.20,.36],[.82,.14,.28]].forEach(([bx,bw,bh])=>ctx.fillRect(w*bx,gy-h*bh,w*bw,h*bh))}
  else if(key==='golden_room'){for(let i=3;i>0;i--){ctx.beginPath();ctx.arc(w*.5,h*.45,i*35,0,Math.PI*2);ctx.strokeStyle=c.sky[1]+Math.floor(60/i).toString(16).padStart(2,'0');ctx.lineWidth=i*2;ctx.stroke()}}
  else if(key==='sunrise'){ctx.beginPath();ctx.arc(w*.5,gy,32,Math.PI,0);ctx.closePath();ctx.fillStyle=c.sky[1]+'EE';ctx.fill();TREES.forEach(([tx,tw,th])=>{ctx.fillStyle=c.sky[0]+'44';ctx.beginPath();ctx.moveTo(w*tx,gy-h*th);ctx.lineTo(w*tx-w*tw/2,gy);ctx.lineTo(w*tx+w*tw/2,gy);ctx.closePath();ctx.fill()})}
  else if(key==='rainy'){ctx.fillStyle=c.sky[0]+'30';ctx.fillRect(0,0,w,h);ctx.strokeStyle=c.sky[1]+'40';ctx.lineWidth=1;RAIN.slice(0,30).forEach(r=>{const dy=(t*r.sp*.015)%1,ry=((r.y+dy)%1)*h;ctx.beginPath();ctx.moveTo(w*r.x,ry);ctx.lineTo(w*r.x-2,ry+h*r.len);ctx.stroke()})}
  else if(key==='night'){ctx.fillStyle=c.sky[0]+'44';ctx.fillRect(0,0,w,gy);ctx.fillStyle=c.minFig+'33';ctx.beginPath();ctx.arc(w*.75,h*.15,20,0,Math.PI*2);ctx.fill();STARS.slice(0,15).forEach(s=>{ctx.fillStyle=c.minFig+'88';ctx.beginPath();ctx.arc(w*s.x,h*s.y*.6,s.r*.6,0,Math.PI*2);ctx.fill()})}
  else if(key==='park_sunset'){ctx.beginPath();ctx.arc(w*.5,gy,28,Math.PI,0);ctx.closePath();ctx.fillStyle=c.sky[1]+'DD';ctx.fill();[[.1,.3,.28],[.75,.28,.22]].forEach(([tx,tw,th])=>{ctx.fillStyle='#2D4A1E88';ctx.beginPath();ctx.arc(w*tx,gy-h*th,h*tw*.4,0,Math.PI*2);ctx.fill()})}
  const mFig={skin:'#F4A070',hair:'#2D1B00',shirt:c.minFig,pants:'#2C3A50',shoe:'#1A1A2E'}
  drawFigure(ctx,w*.5,h*.86,h*.52,c.pose,mFig,t,false)
  ctx.strokeStyle=c.sky[0]+'55'; ctx.lineWidth=1; ctx.strokeRect(12,12,w-24,h-24)
}

// ─── Tech/Terminal renderer ─────────────────────────────────────────
function renderTech(ctx, w, h, c, t, mode) {
  const col=c.col||'#00FF41'
  ctx.textAlign='center'
  if (mode==='minimal') {
    ctx.fillStyle='#F0F4F8'; ctx.fillRect(0,0,w,h)
    ctx.fillStyle=col+'22'; ctx.fillRect(12,12,w-24,h-24)
    ctx.fillStyle='#1A1A2E'; ctx.font=`bold ${Math.round(w*.08)}px monospace`
    ctx.fillText(c.cmd,w*.5,h*.4)
    ctx.fillStyle='#666'; ctx.font=`${Math.round(w*.06)}px monospace`
    ctx.fillText(c.desc,w*.5,h*.58)
  } else if (mode==='neon') {
    ctx.fillStyle='#04040C'; ctx.fillRect(0,0,w,h)
    ctx.save(); ctx.globalCompositeOperation='lighter'
    ctx.fillStyle=col+'18'; ctx.font=`${Math.round(w*.055)}px monospace`
    for(let i=0;i<8;i++){const x=w*.1+i*w*.1,y=((t*.8+i*.3)%1)*h;ctx.fillText('01',x,y)}
    ctx.restore()
    ctx.shadowBlur=20; ctx.shadowColor=col; ctx.fillStyle=col; ctx.font=`bold ${Math.round(w*.09)}px monospace`
    ctx.fillText(c.cmd,w*.5,h*.42)
    ctx.shadowBlur=0; ctx.fillStyle=col+'AA'; ctx.font=`${Math.round(w*.065)}px monospace`
    ctx.fillText(c.desc,w*.5,h*.58)
    ctx.strokeStyle=col+'22'; ctx.lineWidth=1; ctx.strokeRect(3,3,w-6,h-6)
  } else {
    ctx.fillStyle='#0D1117'; ctx.fillRect(0,0,w,h)
    ctx.fillStyle='#21262D'; ctx.fillRect(0,0,w,h*.1)
    ctx.fillStyle=col+'CC'; ctx.font=`bold ${Math.round(w*.085)}px monospace`
    ctx.fillText(c.cmd,w*.5,h*.42)
    ctx.fillStyle='rgba(255,255,255,.45)'; ctx.font=`${Math.round(w*.062)}px monospace`
    ctx.fillText(c.desc,w*.5,h*.58)
    const blink=Math.sin(t*4)>0
    if(blink){ctx.fillStyle=col;ctx.fillRect(w*.5+45,h*.3,2,h*.1)}
    const vg=ctx.createRadialGradient(w*.5,h*.5,h*.1,w*.5,h*.5,h*.7)
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.5)')
    ctx.fillStyle=vg; ctx.fillRect(0,0,w,h)
  }
  ctx.textAlign='start'
}

// ─── Background starfield canvas (hero) ─────────────────────────────
const bgCanvas = ref(null)

function renderBg(ctx, w, h, t) {
  const sky=ctx.createLinearGradient(0,0,0,h)
  sky.addColorStop(0,'#07052A'); sky.addColorStop(.5,'#0E0B3D'); sky.addColorStop(1,'#1A0A2E')
  ctx.fillStyle=sky; ctx.fillRect(0,0,w,h)
  STARS.forEach(s=>{
    const a=.2+.5*Math.sin(t*s.sp+s.ph)
    ctx.globalAlpha=a; ctx.fillStyle='#fff'
    ctx.beginPath(); ctx.arc(w*s.x,h*s.y*.5,s.r*.6,0,Math.PI*2); ctx.fill()
  }); ctx.globalAlpha=1
  ;[{x:.15,y:.3,r:120,c:'rgba(99,102,241,.06)'},{x:.85,y:.6,r:180,c:'rgba(139,92,246,.05)'}].forEach(o=>{
    const g=ctx.createRadialGradient(w*o.x,h*o.y,0,w*o.x,h*o.y,o.r)
    g.addColorStop(0,o.c); g.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h)
  })
}

// ─── Canvas pool management ─────────────────────────────────────────
// Each entry: { el, ctx, w, h, key, fixedStyle|null }
const canvasPool = []

function initCanvas(el) {
  const dpr=window.devicePixelRatio||1
  const pw=el.offsetWidth||160, ph=el.offsetHeight||220
  el.width=pw*dpr; el.height=ph*dpr
  const ctx=el.getContext('2d')
  ctx.scale(dpr,dpr)
  return { ctx, w:pw, h:ph }
}

function registerCanvas(el, key, fixedStyle) {
  if (!el) return
  const existing = canvasPool.find(e => e.el === el)
  if (existing) { existing.key=key; return }
  const { ctx, w, h } = initCanvas(el)
  canvasPool.push({ el, ctx, w, h, key, fixedStyle: fixedStyle ?? null })
}

const heroCardKeys = ref(['plaza_day','golden_room','sunrise','park_sunset']) // will update on nextQ

function setHeroCanvas(el, idx, sceneKey) {
  if (!el) return
  const existing = canvasPool.find(e => e.el === el)
  if (existing) { existing.key=sceneKey; return }
  const { ctx, w, h } = initCanvas(el)
  canvasPool.push({ el, ctx, w, h, key: sceneKey, fixedStyle: null })
}

function registerGallery(el, key) { registerCanvas(el, key, null) }
function registerComp(el, key, fixedStyle) { registerCanvas(el, key, fixedStyle) }
function registerTech(el, key) { registerCanvas(el, key, 'cinematic') }

// ─── rAF render loop ────────────────────────────────────────────────
let rafId = null, t0 = null

function loop(ts) {
  rafId = requestAnimationFrame(loop)
  if (!t0) t0 = ts
  const t = (ts - t0) / 1000

  // Background
  if (bgCanvas.value) {
    const el = bgCanvas.value
    if (!el._rdy) {
      const dpr=window.devicePixelRatio||1
      el.width=el.offsetWidth*dpr; el.height=el.offsetHeight*dpr
      el._ctx=el.getContext('2d'); el._ctx.scale(dpr,dpr); el._rdy=true
    }
    renderBg(el._ctx, el.offsetWidth, el.offsetHeight, t)
  }

  // All registered canvases
  const style = activeStyle.value
  canvasPool.forEach(item => {
    const s = item.fixedStyle ?? style
    const { ctx, w, h, key } = item
    ctx.clearRect(0,0,w,h)
    if (s==='cinematic')    renderCinematic(ctx,w,h,key,t)
    else if (s==='neon')    renderNeon(ctx,w,h,key,t)
    else                    renderMinimal(ctx,w,h,key,t)
  })
}

// ─── Hero quiz state ────────────────────────────────────────────────
const QUIZ = [
  { q:'Hola',          sub:'Spanisch → Deutsch', ans:0, choices:[{w:'Hallo',s:'plaza_day'},{w:'Danke',s:'golden_room'},{w:'Guten Morgen',s:'sunrise'},{w:'Tschüss',s:'park_sunset'}] },
  { q:'Gracias',       sub:'Spanisch → Deutsch', ans:1, choices:[{w:'Entschuldigung',s:'rainy'},{w:'Danke',s:'golden_room'},{w:'Hallo',s:'plaza_day'},{w:'Gute Nacht',s:'night'}] },
  { q:'Buenas noches', sub:'Spanisch → Deutsch', ans:0, choices:[{w:'Gute Nacht',s:'night'},{w:'Hallo',s:'plaza_day'},{w:'Danke',s:'golden_room'},{w:'Tschüss',s:'park_sunset'}] },
  { q:'Lo siento',     sub:'Spanisch → Deutsch', ans:3, choices:[{w:'Hallo',s:'plaza_day'},{w:'Guten Morgen',s:'sunrise'},{w:'Danke',s:'golden_room'},{w:'Entschuldigung',s:'rainy'}] },
]
const heroQIdx    = ref(0)
const heroQ       = computed(() => QUIZ[heroQIdx.value])
const heroAnswered = ref(false)
const heroChosen  = ref(-1)

function answerHero(i) {
  if (heroAnswered.value) return
  heroChosen.value = i
  heroAnswered.value = true
}
function nextHeroQ() {
  heroQIdx.value = (heroQIdx.value + 1) % QUIZ.length
  heroAnswered.value = false
  heroChosen.value   = -1
  // Update scene keys for hero canvases in pool
  const q = QUIZ[heroQIdx.value]
  // find hero canvases by their index order (they registered first within the demo-grid)
  const heroItems = canvasPool.filter(e => e.fixedStyle === null && !LANG_SCENES.find(s => s.key === e.key) && !TECH_SCENES.find(s => s.key === e.key))
  q.choices.forEach((c, i) => { if (heroItems[i]) heroItems[i].key = c.s })
}

// ─── Lifecycle ──────────────────────────────────────────────────────
onMounted(async () => {
  // PWA standalone: skip home page
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  if (isStandalone) {
    const lang = selectedLanguage.value || localStorage.getItem('lastLearningLanguage') || 'deutsch'
    router.replace({ name: 'workshop-overview', params: { learning: lang } })
    return
  }
  if (Object.keys(availableContent.value).length === 0) {
    await loadAvailableContent()
  }
  // Two rAF ticks so layout is complete before reading canvas sizes
  requestAnimationFrame(() => requestAnimationFrame(() => { rafId = requestAnimationFrame(loop) }))
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  canvasPool.length = 0
})
</script>

<style scoped>
/* ── Root ─────────────────────────────────────────────────────────── */
.home-root {
  min-height: 100vh;
  font-family: system-ui, -apple-system, sans-serif;
  background: #080810;
  color: #f4f4f5;
}

/* ── HERO ─────────────────────────────────────────────────────────── */
.hero {
  position: relative;
  min-height: 100svh;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.hero-bg {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  display: block;
}
.hero-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(7,5,42,.88) 42%, rgba(7,5,42,.25) 100%);
  pointer-events: none;
}
.hero-inner {
  position: relative; z-index: 1;
  width: 100%; max-width: 1200px; margin: 0 auto;
  padding: 80px 24px 56px;
  display: flex; align-items: center; gap: 48px;
}
.hero-left  { flex: 1; min-width: 0; }
.hero-right { flex: 0 0 470px; }

.hero-pill {
  display: inline-block;
  padding: 5px 14px;
  border: 1px solid rgba(99,102,241,.45);
  border-radius: 100px;
  font-size: 12px; font-weight: 700; letter-spacing: 1px;
  color: #818cf8; background: rgba(99,102,241,.1);
  margin-bottom: 20px;
}
.hero-h1 {
  font-size: clamp(26px,4.5vw,54px);
  font-weight: 900; letter-spacing: -1.5px; line-height: 1.08;
  color: #fff; margin-bottom: 16px;
}
.hero-p {
  font-size: 15px; color: rgba(255,255,255,.52); line-height: 1.65;
  margin-bottom: 24px; max-width: 420px;
}

/* Style bar */
.style-bar { display: flex; gap: 6px; margin-bottom: 28px; }
.sty-btn {
  padding: 7px 16px; border-radius: 100px;
  border: 1.5px solid rgba(255,255,255,.14);
  background: transparent; color: rgba(255,255,255,.38);
  font-size: 12px; font-weight: 700; letter-spacing: .5px;
  cursor: pointer; transition: all .2s; text-transform: uppercase;
}
.sty-btn.on, .sty-btn:hover {
  background: rgba(255,255,255,.11); border-color: rgba(255,255,255,.4); color: #fff;
}

/* Lang selector */
.hero-cta { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.lang-selector-wrap { position: relative; }
.lang-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; border-radius: 12px;
  border: 1.5px solid rgba(99,102,241,.6);
  background: rgba(99,102,241,.12); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer; transition: background .2s;
}
.lang-btn:hover { background: rgba(99,102,241,.22); }
.lang-chevron { opacity: .55; }
.lang-menu {
  position: absolute; top: calc(100% + 6px); left: 0;
  background: #1a1a2e; border: 1px solid rgba(99,102,241,.3);
  border-radius: 12px; padding: 6px; min-width: 180px; z-index: 100;
  box-shadow: 0 8px 32px rgba(0,0,0,.6);
}
.lang-option {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 8px 12px; border: none; border-radius: 8px;
  background: transparent; color: rgba(255,255,255,.72);
  font-size: 13px; cursor: pointer; transition: background .15s;
}
.lang-option:hover, .lang-option.active { background: rgba(99,102,241,.25); color: #fff; }
.start-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; border-radius: 12px; border: none;
  background: #6366f1; color: #fff; font-size: 14px; font-weight: 700;
  cursor: pointer; transition: opacity .2s;
}
.start-btn:hover { opacity: .85; }
.skill-tag {
  margin-top: 20px; font-size: 10px; letter-spacing: 1.5px;
  text-transform: uppercase; color: rgba(255,255,255,.18);
}
.lang-drop-enter-active, .lang-drop-leave-active { transition: opacity .15s, transform .15s; }
.lang-drop-enter-from, .lang-drop-leave-to { opacity: 0; transform: translateY(-6px); }

/* ── DEMO CARD ────────────────────────────────────────────────────── */
.demo-card {
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
  border-radius: 24px; padding: 18px; backdrop-filter: blur(12px);
}
.demo-header { text-align: center; margin-bottom: 14px; }
.demo-label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,.28); margin-bottom: 6px; }
.demo-word  { font-size: 34px; font-weight: 900; letter-spacing: -1px; color: #fff; }
.demo-grid  {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 8px; height: 340px;
}
.choice-cell {
  position: relative; border-radius: 16px; overflow: hidden;
  cursor: pointer; transition: box-shadow .25s, transform .2s, opacity .25s;
  box-shadow: 0 6px 24px rgba(0,0,0,.5);
}
.choice-cell:hover:not(.ok):not(.no) { transform: translateY(-2px); }
.choice-cell.ok  { box-shadow: 0 0 0 3px #4ade80, 0 6px 24px rgba(74,222,128,.25); }
.choice-cell.no  { box-shadow: 0 0 0 3px #f87171, 0 6px 24px rgba(248,113,113,.2); }
.choice-cell.dim { opacity: .45; }
.choice-canvas { width: 100%; height: 100%; display: block; }
.choice-label-row {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 32px 10px 10px;
  background: linear-gradient(to top, rgba(0,0,0,.85), transparent);
  display: flex; align-items: center; justify-content: space-between;
}
.choice-word { font-size: 16px; font-weight: 800; color: #fff; }
.badge-ok { width: 20px; height: 20px; border-radius: 50%; background: #4ade80; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; color: #fff; }
.badge-no { width: 20px; height: 20px; border-radius: 50%; background: #f87171; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; color: #fff; }
.next-btn {
  display: block; width: 100%; margin-top: 10px; padding: 10px;
  border-radius: 12px; border: 1px solid rgba(99,102,241,.4);
  background: rgba(99,102,241,.15); color: #a5b4fc;
  font-size: 13px; font-weight: 700; cursor: pointer; transition: background .2s;
}
.next-btn:hover { background: rgba(99,102,241,.28); }

/* ── SHARED SECTION STYLES ───────────────────────────────────────── */
.sec-inner  { max-width: 1100px; margin: 0 auto; padding: 80px 24px; }
.sec-tag    { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #6366f1; margin-bottom: 12px; }
.sec-h2     { font-size: clamp(22px,3.5vw,38px); font-weight: 900; letter-spacing: -1px; color: #fff; margin-bottom: 10px; }
.sec-p      { font-size: 15px; color: rgba(255,255,255,.42); line-height: 1.65; margin-bottom: 36px; }
.scene-label { display: block; margin-top: 8px; font-size: 11px; color: rgba(255,255,255,.32); text-align: center; line-height: 1.4; }

/* ── SCENE GALLERY ───────────────────────────────────────────────── */
.gallery-sec { background: rgba(255,255,255,.02); }
.scene-gallery { display: grid; grid-template-columns: repeat(6,1fr); gap: 10px; }
.scene-tile    { position: relative; }
.scene-canvas  { width: 100%; aspect-ratio: 2/3; display: block; border-radius: 14px; }

/* ── STYLE COMPARISON ────────────────────────────────────────────── */
.compare-sec  { background: #06060F; }
.compare-row  { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
.compare-tile {
  cursor: pointer; border-radius: 18px; overflow: hidden;
  border: 2px solid transparent; transition: border-color .25s, transform .2s;
}
.compare-tile:hover { transform: translateY(-3px); }
.compare-tile.active { border-color: #6366f1; }
.comp-canvas  { width: 100%; aspect-ratio: 3/4; display: block; }
.comp-footer  { padding: 10px 14px; background: rgba(255,255,255,.04); display: flex; align-items: center; justify-content: space-between; }
.comp-name    { font-size: 13px; font-weight: 700; text-transform: capitalize; color: rgba(255,255,255,.65); }
.comp-active  { font-size: 11px; color: #818cf8; font-weight: 600; }

/* ── TECH SCENES ─────────────────────────────────────────────────── */
.tech-sec  { background: rgba(255,255,255,.015); }
.tech-row  { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
.tech-tile { border-radius: 14px; overflow: hidden; }
.tech-canvas { width: 100%; aspect-ratio: 16/10; display: block; }

/* ── HOW IT WORKS ────────────────────────────────────────────────── */
.how-sec   { background: #06060F; }
.steps-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
.step-card { padding: 24px; border-radius: 16px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); }
.step-num  { width: 34px; height: 34px; border-radius: 50%; background: #6366f1; color: #fff; font-size: 15px; font-weight: 900; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
.step-title { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 6px; }
.step-desc  { font-size: 13px; color: rgba(255,255,255,.38); line-height: 1.55; }

/* ── CTA ─────────────────────────────────────────────────────────── */
.cta-sec    { border-top: 1px solid rgba(255,255,255,.06); }
.cta-inner  { text-align: center; }
.cta-h2     { font-size: clamp(22px,3.5vw,38px); font-weight: 900; color: #fff; margin-bottom: 12px; }
.cta-p      { font-size: 15px; color: rgba(255,255,255,.42); margin-bottom: 28px; }
.cta-btns   { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.btn-primary { padding: 12px 24px; border-radius: 12px; background: #6366f1; color: #fff; font-size: 14px; font-weight: 700; text-decoration: none; transition: opacity .2s; }
.btn-primary:hover { opacity: .84; }
.btn-ghost { padding: 12px 24px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,.14); color: rgba(255,255,255,.65); font-size: 14px; font-weight: 600; text-decoration: none; transition: border-color .2s; }
.btn-ghost:hover { border-color: rgba(255,255,255,.38); color: #fff; }

/* ── RESPONSIVE ──────────────────────────────────────────────────── */
@media (max-width: 960px) {
  .hero-inner { flex-direction: column; padding: 70px 16px 40px; gap: 28px; }
  .hero-right { flex: none; width: 100%; max-width: 440px; align-self: center; }
  .scene-gallery { grid-template-columns: repeat(3,1fr); }
  .compare-row, .steps-row, .tech-row { grid-template-columns: repeat(2,1fr); }
}
@media (max-width: 540px) {
  .scene-gallery { grid-template-columns: repeat(2,1fr); }
  .compare-row, .steps-row, .tech-row { grid-template-columns: 1fr; }
  .demo-grid { height: 260px; }
}
</style>
