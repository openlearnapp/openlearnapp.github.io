<template>
  <div class="home-root" @click="showLanguageMenu && (showLanguageMenu = false)">

    <!-- ═══════ HERO ═══════ -->
    <section class="hero">
      <canvas ref="bgCanvas" class="hero-bg" aria-hidden="true" />
      <div class="hero-overlay" />
      <div class="hero-inner">
        <div class="hero-pill">🎓 Open Learn</div>
        <h1 class="hero-h1">{{ $t('home.title') }}</h1>
        <p class="hero-p">{{ $t('home.subtitle') }}</p>

        <div class="hero-cta" @click.stop>
          <div class="lang-selector-wrap">
            <button class="lang-btn" @click.stop="showLanguageMenu = !showLanguageMenu">
              <span>{{ getFlag(currentLanguage) }}</span>
              <span>{{ formatLangName(currentLanguage) }}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <Transition name="drop">
              <div v-if="showLanguageMenu" class="lang-menu">
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </section>

    <!-- ═══════ HOW IT WORKS ═══════ -->
    <section class="content-sec">
      <div class="sec-inner">
        <h2 class="sec-h2">{{ $t('home.howItWorks') }}</h2>
        <div class="steps-list">

          <div class="step-row">
            <div class="step-text">
              <div class="step-num">1</div>
              <div class="step-title">{{ $t('home.steps.pickLang') }}</div>
              <p class="step-desc">{{ $t('home.steps.pickLangDesc') }}</p>
            </div>
            <div class="anim-window">
              <canvas :ref="el => reg(el, 'pick_lang')" class="anim-canvas" />
            </div>
          </div>

          <div class="step-row reverse">
            <div class="step-text">
              <div class="step-num">2</div>
              <div class="step-title">{{ $t('home.steps.startWorkshop') }}</div>
              <p class="step-desc">{{ $t('home.steps.startWorkshopDesc') }}</p>
            </div>
            <div class="anim-window">
              <canvas :ref="el => reg(el, 'start_workshop')" class="anim-canvas" />
            </div>
          </div>

          <div class="step-row">
            <div class="step-text">
              <div class="step-num">3</div>
              <div class="step-title">{{ $t('home.steps.learnTrack') }}</div>
              <p class="step-desc">{{ $t('home.steps.learnTrackDesc') }}</p>
            </div>
            <div class="anim-window">
              <canvas :ref="el => reg(el, 'learn_track')" class="anim-canvas" />
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ═══════ BUILT-IN TOOLS ═══════ -->
    <section class="content-sec alt">
      <div class="sec-inner">
        <h2 class="sec-h2">{{ $t('home.builtInTools') }}</h2>
        <div class="tools-grid">

          <div class="tool-row">
            <div class="anim-window small">
              <canvas :ref="el => reg(el, 'tool_audio')" class="anim-canvas" />
            </div>
            <div class="tool-text">
              <div class="tool-title">🔊 {{ $t('home.tools.audio') }}</div>
              <p class="tool-desc">{{ $t('home.tools.audioDesc') }}</p>
            </div>
          </div>

          <div class="tool-row">
            <div class="anim-window small">
              <canvas :ref="el => reg(el, 'tool_quiz')" class="anim-canvas" />
            </div>
            <div class="tool-text">
              <div class="tool-title">✅ {{ $t('home.tools.assessments') }}</div>
              <p class="tool-desc">{{ $t('home.tools.assessmentsDesc') }}</p>
            </div>
          </div>

          <div class="tool-row">
            <div class="anim-window small">
              <canvas :ref="el => reg(el, 'tool_progress')" class="anim-canvas" />
            </div>
            <div class="tool-text">
              <div class="tool-title">📊 {{ $t('home.tools.progress') }}</div>
              <p class="tool-desc">{{ $t('home.tools.progressDesc') }}</p>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ═══════ PRIVACY ═══════ -->
    <section class="content-sec">
      <div class="sec-inner split-sec">
        <div class="split-text">
          <h2 class="sec-h2">{{ $t('home.privacyTitle') }}</h2>
          <div class="privacy-list">
            <div v-for="p in privacyPoints" :key="p.key" class="privacy-item">
              <div class="privacy-title">{{ p.title }}</div>
              <p class="privacy-desc">{{ p.desc }}</p>
            </div>
          </div>
        </div>
        <div class="anim-window tall">
          <canvas :ref="el => reg(el, 'privacy')" class="anim-canvas" />
        </div>
      </div>
    </section>

    <!-- ═══════ WHAT YOU CAN LEARN ═══════ -->
    <section class="content-sec alt">
      <div class="sec-inner split-sec">
        <div class="anim-window tall">
          <canvas :ref="el => reg(el, 'topics')" class="anim-canvas" />
        </div>
        <div class="split-text">
          <h2 class="sec-h2">{{ $t('home.whatYouCanLearn') }}</h2>
          <p class="sec-p">{{ $t('home.whatYouCanLearnDesc') }}</p>
          <div class="topic-chips">
            <div v-for="ex in useCaseExamples" :key="ex.key" class="topic-chip">
              <span>{{ ex.icon }}</span>
              <span>{{ ex.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ OPEN SOURCE CTA ═══════ -->
    <section class="cta-sec">
      <div class="sec-inner cta-inner">
        <div class="anim-window cta-anim">
          <canvas :ref="el => reg(el, 'opensource')" class="anim-canvas" />
        </div>
        <div class="cta-text">
          <h2 class="cta-h2">{{ $t('home.openSourceTitle') }}</h2>
          <p class="cta-p">{{ $t('home.openSourceDesc') }}</p>
          <div class="cta-btns">
            <a href="https://github.com/openlearnapp/openlearnapp.github.io"
              target="_blank" rel="noopener" class="btn-primary">{{ $t('home.viewOnGitHub') }}</a>
            <a href="#/creators" class="btn-ghost">{{ $t('home.forCreatorsLink') }}</a>
          </div>
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

const showLanguageMenu = ref(false)
const learningLanguages = computed(() => [...new Set(Object.keys(availableContent.value))])
const currentLanguage  = computed(() => selectedLanguage.value || learningLanguages.value[0] || 'english')

function selectLanguage(lang) { showLanguageMenu.value = false; setLanguage(lang) }
function goToWorkshops(lang)  { setLanguage(lang); router.push({ name: 'workshop-overview', params: { learning: lang } }) }

const privacyPoints = computed(() => [
  { key: 'local',   title: t('home.privacy.local'),     desc: t('home.privacy.localDesc') },
  { key: 'notrack', title: t('home.privacy.noTracking'), desc: t('home.privacy.noTrackingDesc') },
  { key: 'export',  title: t('home.privacy.yourData'),   desc: t('home.privacy.yourDataDesc') },
])

const useCaseExamples = computed(() => [
  { key: 'lang',    icon: '🌍', label: t('home.useCases.languages') },
  { key: 'math',    icon: '🧮', label: t('home.useCases.math') },
  { key: 'drive',   icon: '🚗', label: t('home.useCases.driving') },
  { key: 'music',   icon: '🎵', label: t('home.useCases.music') },
  { key: 'code',    icon: '💻', label: t('home.useCases.coding') },
  { key: 'science', icon: '🔬', label: t('home.useCases.science') },
  { key: 'history', icon: '📜', label: t('home.useCases.history') },
  { key: 'med',     icon: '🏥', label: t('home.useCases.medicine') },
  { key: 'law',     icon: '⚖️', label: t('home.useCases.law') },
])

// ═══════════════════════════════════════════════════════════════════
// CANVAS ANIMATION SYSTEM
// ═══════════════════════════════════════════════════════════════════

// Shared static data (no new random per frame)
const STARS  = Array.from({length:60}, () => ({x:Math.random(),y:Math.random(),r:.6+Math.random()*2,ph:Math.random()*6.28,sp:.3+Math.random()*1.4}))
const DOTS   = Array.from({length:30}, () => ({x:Math.random(),y:Math.random(),r:1+Math.random()*3,ph:Math.random()*6.28,sp:.2+Math.random()}))

// Bezier-tapered limb — from experiments/18 + quiz-scenes skill PR #15
function limb(ctx, x1, y1, x2, y2, w1, w2, col) {
  const dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy); if(len<1) return
  const nx=dy/len, ny=-dx/len
  ctx.beginPath()
  ctx.moveTo(x1+nx*w1, y1+ny*w1)
  ctx.bezierCurveTo((x1*2+x2)/3+nx*(w1*.6+w2*.4),(y1*2+y2)/3+ny*(w1*.6+w2*.4),(x1+x2*2)/3+nx*(w1*.4+w2*.6),(y1+y2*2)/3+ny*(w1*.4+w2*.6),x2+nx*w2,y2+ny*w2)
  ctx.lineTo(x2-nx*w2, y2-ny*w2)
  ctx.bezierCurveTo((x1+x2*2)/3-nx*(w1*.4+w2*.6),(y1+y2*2)/3-ny*(w1*.4+w2*.6),(x1*2+x2)/3-nx*(w1*.6+w2*.4),(y1*2+y2)/3-ny*(w1*.6+w2*.4),x1-nx*w1,y1-ny*w1)
  ctx.closePath(); ctx.fillStyle=col; ctx.fill()
}

// Simple reading/standing figure
function drawFigure(ctx, cx, by, scale, t, shirt='#6366f1') {
  const u=scale, breath=Math.sin(t*1.1)*u*.8
  const sk='#F4A070', hair='#2D1A0E', pants='#1E1B4B', shoe='#0F0D26'
  const shY=by-28*u+breath, hipY=by-10*u+breath, hdY=by-40*u+breath

  // Shadow
  const sg=ctx.createRadialGradient(cx,by,0,cx,by,12*u)
  sg.addColorStop(0,'rgba(0,0,0,.2)'); sg.addColorStop(1,'rgba(0,0,0,0)')
  ctx.fillStyle=sg; ctx.beginPath(); ctx.ellipse(cx,by,12*u,3*u,0,0,Math.PI*2); ctx.fill()

  // Legs
  limb(ctx,cx-3*u,hipY,cx-4*u,by,5*u,3.5*u,pants)
  limb(ctx,cx+3*u,hipY,cx+4*u,by,5*u,3.5*u,pants)
  // Shoes
  ctx.beginPath(); ctx.ellipse(cx-5*u,by,5*u,2.5*u,-.1,0,Math.PI*2); ctx.fillStyle=shoe; ctx.fill()
  ctx.beginPath(); ctx.ellipse(cx+5*u,by,5*u,2.5*u,.1,0,Math.PI*2);  ctx.fillStyle=shoe; ctx.fill()
  // Torso
  limb(ctx,cx,shY,cx,hipY,9*u,7*u,shirt)
  // Arms (reading pose)
  const wa=Math.sin(t*.8)*u*.5
  limb(ctx,cx-9*u,shY+2*u,cx-14*u,shY+15*u+wa,4.5*u,3*u,sk)
  limb(ctx,cx+9*u,shY+2*u,cx+14*u,shY+15*u+wa,4.5*u,3*u,sk)
  // Neck
  limb(ctx,cx,shY,cx,shY-5*u,3.5*u,3*u,sk)
  // Head
  ctx.beginPath(); ctx.arc(cx,hdY+breath,7*u,0,Math.PI*2); ctx.fillStyle=sk; ctx.fill()
  ctx.beginPath(); ctx.arc(cx,hdY+breath-1*u,7*u,Math.PI,Math.PI*2); ctx.fillStyle=hair; ctx.fill()
  // Eyes
  const blink=Math.sin(t*.35)>.96 ? 0 : 1
  ctx.fillStyle='#1A1A2E'
  for (const ex of [cx-2.5*u, cx+2.5*u]) {
    ctx.beginPath()
    if(blink) ctx.arc(ex,hdY+breath+1*u,.9*u,0,Math.PI*2)
    else ctx.ellipse(ex,hdY+breath+1*u,.9*u,.3*u,0,0,Math.PI*2)
    ctx.fill()
  }
  // Smile
  ctx.strokeStyle='#FF8A80'; ctx.lineWidth=.8*u; ctx.lineCap='round'
  ctx.beginPath(); ctx.arc(cx,hdY+breath+2.5*u,2.2*u,0,Math.PI); ctx.stroke()
}

// ── Scene renderers ─────────────────────────────────────────────────

function scene_pick_lang(ctx, w, h, t) {
  // Dark bg with floating language bubbles, figure pointing
  ctx.fillStyle='#0a0a18'; ctx.fillRect(0,0,w,h)
  // Soft glow
  const g=ctx.createRadialGradient(w*.5,h*.6,0,w*.5,h*.6,w*.7)
  g.addColorStop(0,'rgba(99,102,241,.12)'); g.addColorStop(1,'rgba(0,0,0,0)')
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h)

  // Floating language flags/bubbles
  const langs=[
    {emoji:'🇩🇪',ox:-.28,oy:-.18,ph:0},
    {emoji:'🇬🇧',ox:.22,oy:-.25,ph:1.5},
    {emoji:'🇮🇷',ox:-.3,oy:.05,ph:3},
    {emoji:'🇸🇦',ox:.28,oy:.0,ph:4.7},
    {emoji:'🇪🇸',ox:.0,oy:-.32,ph:2.1},
  ]
  ctx.textAlign='center'; ctx.textBaseline='middle'
  langs.forEach(l=>{
    const fly=Math.sin(t*.7+l.ph)*h*.04
    const fade=.5+.4*Math.sin(t*.5+l.ph)
    const bx=w*.5+l.ox*w, by=h*.38+l.oy*h+fly
    // Bubble
    ctx.globalAlpha=fade
    ctx.fillStyle='rgba(99,102,241,.18)'
    ctx.beginPath(); ctx.roundRect(bx-18,by-14,36,28,10); ctx.fill()
    ctx.strokeStyle='rgba(99,102,241,.4)'; ctx.lineWidth=1
    ctx.beginPath(); ctx.roundRect(bx-18,by-14,36,28,10); ctx.stroke()
    ctx.font=`${Math.round(h*.065)}px serif`
    ctx.fillStyle='#fff'; ctx.fillText(l.emoji,bx,by)
    ctx.globalAlpha=1
  })

  // Highlight one bubble
  const chosen=Math.floor(t*.4)%langs.length
  const cl=langs[chosen]
  const fly=Math.sin(t*.7+cl.ph)*h*.04
  ctx.globalAlpha=.9
  ctx.fillStyle='rgba(99,102,241,.35)'
  ctx.beginPath(); ctx.roundRect(w*.5+cl.ox*w-20,h*.38+cl.oy*h+fly-16,40,32,10); ctx.fill()
  ctx.strokeStyle='#818cf8'; ctx.lineWidth=1.5
  ctx.beginPath(); ctx.roundRect(w*.5+cl.ox*w-20,h*.38+cl.oy*h+fly-16,40,32,10); ctx.stroke()
  ctx.globalAlpha=1

  // Figure
  drawFigure(ctx, w*.5, h*.88, h*.038, t, '#6366f1')
  ctx.textAlign='start'; ctx.textBaseline='alphabetic'
}

function scene_start_workshop(ctx, w, h, t) {
  ctx.fillStyle='#0a0a18'; ctx.fillRect(0,0,w,h)
  const g=ctx.createRadialGradient(w*.5,h*.4,0,w*.5,h*.4,w*.7)
  g.addColorStop(0,'rgba(139,92,246,.1)'); g.addColorStop(1,'rgba(0,0,0,0)')
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h)

  // Animated workshop card appearing
  const appear=Math.min(1,(t%6)/1.5)  // 0→1 over 1.5s, repeats every 6s
  const cardH=h*.38, cardW=w*.7
  const cardX=w*.5-cardW/2, cardY=h*.12+h*.04*(1-appear)
  ctx.globalAlpha=appear

  // Card
  ctx.fillStyle='#1a1a2e'; ctx.beginPath(); ctx.roundRect(cardX,cardY,cardW,cardH,12); ctx.fill()
  ctx.strokeStyle='rgba(99,102,241,.4)'; ctx.lineWidth=1.2
  ctx.beginPath(); ctx.roundRect(cardX,cardY,cardW,cardH,12); ctx.stroke()

  // Card header stripe
  ctx.fillStyle='#6366f1'; ctx.beginPath(); ctx.roundRect(cardX,cardY,cardW,h*.06,12); ctx.fill()
  ctx.fillStyle='#6366f1'; ctx.fillRect(cardX,cardY+h*.03,cardW,h*.03)

  // Card content lines
  ctx.fillStyle='rgba(255,255,255,.7)'; ctx.beginPath()
  ctx.roundRect(cardX+12,cardY+h*.1,cardW*.55,h*.03,4); ctx.fill()
  ctx.fillStyle='rgba(255,255,255,.3)'; ctx.beginPath()
  ctx.roundRect(cardX+12,cardY+h*.16,cardW*.38,h*.025,4); ctx.fill()

  // Progress bar
  const pW=(cardW-24)*((.4+.6*Math.sin(t*.3+1))*.8)
  ctx.fillStyle='rgba(255,255,255,.1)'; ctx.beginPath(); ctx.roundRect(cardX+12,cardY+h*.27,cardW-24,h*.025,4); ctx.fill()
  ctx.fillStyle='#6366f1'; ctx.beginPath(); ctx.roundRect(cardX+12,cardY+h*.27,pW,h*.025,4); ctx.fill()

  // "Open" button
  ctx.fillStyle='#6366f1'; ctx.beginPath(); ctx.roundRect(cardX+cardW-80,cardY+cardH-30,68,22,8); ctx.fill()
  ctx.fillStyle='#fff'; ctx.font=`bold ${Math.round(h*.04)}px system-ui`
  ctx.textAlign='center'; ctx.fillText('Start →',cardX+cardW-46,cardY+cardH-15)

  ctx.globalAlpha=1

  drawFigure(ctx, w*.5, h*.88, h*.038, t, '#8b5cf6')
  ctx.textAlign='start'
}

function scene_learn_track(ctx, w, h, t) {
  ctx.fillStyle='#0a0a18'; ctx.fillRect(0,0,w,h)
  const g=ctx.createRadialGradient(w*.5,h*.4,0,w*.5,h*.4,w*.7)
  g.addColorStop(0,'rgba(34,197,94,.08)'); g.addColorStop(1,'rgba(0,0,0,0)')
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h)

  // Quiz card with answer reveal animation
  const phase=(t%5)/5  // 0→1 over 5s
  const cardW=w*.72, cardH=h*.38
  const cardX=w*.5-cardW/2, cardY=h*.1

  ctx.fillStyle='#131320'; ctx.beginPath(); ctx.roundRect(cardX,cardY,cardW,cardH,12); ctx.fill()
  ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=1
  ctx.beginPath(); ctx.roundRect(cardX,cardY,cardW,cardH,12); ctx.stroke()

  // Question
  ctx.fillStyle='rgba(255,255,255,.45)'; ctx.font=`${Math.round(h*.036)}px system-ui`
  ctx.textAlign='center'; ctx.fillText('Hola',w*.5,cardY+h*.1)

  // Answer reveal
  const showAnswer=phase>.45
  if (showAnswer) {
    const revealAmt=Math.min(1,(phase-.45)/.15)
    ctx.globalAlpha=revealAmt
    ctx.fillStyle='rgba(34,197,94,.15)'; ctx.beginPath()
    ctx.roundRect(cardX+8,cardY+cardH*.45,cardW-16,cardH*.35,8); ctx.fill()
    ctx.strokeStyle='rgba(34,197,94,.5)'; ctx.lineWidth=1.2
    ctx.beginPath(); ctx.roundRect(cardX+8,cardY+cardH*.45,cardW-16,cardH*.35,8); ctx.stroke()
    ctx.fillStyle='#4ade80'; ctx.font=`bold ${Math.round(h*.05)}px system-ui`
    ctx.fillText('Hallo ✓',w*.5,cardY+cardH*.7)
    ctx.globalAlpha=1
  } else {
    // Eye icon hint
    ctx.fillStyle='rgba(255,255,255,.2)'
    ctx.font=`${Math.round(h*.04)}px system-ui`
    ctx.fillText('···',w*.5,cardY+cardH*.65)
  }

  // Learning item badges
  const learnedCount=Math.floor(phase*6)
  for(let i=0;i<6;i++){
    const bx=cardX+12+i*(cardW-24)/6+4, by=cardY+cardH+h*.04
    ctx.fillStyle=i<learnedCount?'rgba(34,197,94,.3)':'rgba(255,255,255,.08)'
    ctx.beginPath(); ctx.roundRect(bx,by,(cardW-24)/6-8,h*.035,5); ctx.fill()
    if(i<learnedCount){
      ctx.strokeStyle='rgba(34,197,94,.6)'; ctx.lineWidth=.8
      ctx.beginPath(); ctx.roundRect(bx,by,(cardW-24)/6-8,h*.035,5); ctx.stroke()
    }
  }
  ctx.globalAlpha=1

  drawFigure(ctx, w*.5, h*.9, h*.036, t, '#22c55e')
  ctx.textAlign='start'
}

function scene_tool_audio(ctx, w, h, t) {
  ctx.fillStyle='#0a0a18'; ctx.fillRect(0,0,w,h)
  const cx=w*.5, cy=h*.42

  // Waveform bars
  const bars=18
  for(let i=0;i<bars;i++){
    const x=cx-bars/2*(w*.045)+i*(w*.045)
    const phase=t*2+i*.4
    const hh=Math.abs(Math.sin(phase))*(h*.22)+h*.03
    const grad=ctx.createLinearGradient(x,cy-hh,x,cy+hh)
    grad.addColorStop(0,'#818cf8'); grad.addColorStop(1,'#6366f1')
    ctx.fillStyle=grad
    ctx.beginPath(); ctx.roundRect(x-w*.015,cy-hh,w*.03,hh*2,4); ctx.fill()
  }

  // Speed badge
  ctx.fillStyle='rgba(99,102,241,.25)'; ctx.beginPath(); ctx.roundRect(cx-24,h*.72,48,20,8); ctx.fill()
  ctx.fillStyle='#a5b4fc'; ctx.font=`bold ${Math.round(h*.055)}px system-ui`
  ctx.textAlign='center'; ctx.fillText('0.8×',cx,h*.735)

  // Headphone figure
  drawFigure(ctx, w*.5, h*.95, h*.03, t, '#6366f1')
  ctx.textAlign='start'
}

function scene_tool_quiz(ctx, w, h, t) {
  ctx.fillStyle='#0a0a18'; ctx.fillRect(0,0,w,h)
  const phase=(t%4)/4
  const opts=[
    {label:'A', col: phase>.5?'rgba(34,197,94,.25)':'rgba(255,255,255,.06)', border: phase>.5?'rgba(34,197,94,.6)':'rgba(255,255,255,.1)', check: phase>.5},
    {label:'B', col:'rgba(255,255,255,.06)', border:'rgba(255,255,255,.1)', check:false},
    {label:'C', col:'rgba(255,255,255,.06)', border:'rgba(255,255,255,.1)', check:false},
  ]
  const cardW=w*.82, cardX=w*.5-cardW/2

  ctx.fillStyle='rgba(255,255,255,.35)'; ctx.font=`${Math.round(h*.042)}px system-ui`
  ctx.textAlign='center'; ctx.fillText('What is 2+2?',w*.5,h*.15)

  opts.forEach((o,i)=>{
    const y=h*.25+i*h*.19
    ctx.fillStyle=o.col; ctx.beginPath(); ctx.roundRect(cardX,y,cardW,h*.14,8); ctx.fill()
    ctx.strokeStyle=o.border; ctx.lineWidth=1.2
    ctx.beginPath(); ctx.roundRect(cardX,y,cardW,h*.14,8); ctx.stroke()
    ctx.fillStyle=o.check?'#4ade80':'rgba(255,255,255,.45)'; ctx.textAlign='left'
    ctx.font=`${Math.round(h*.042)}px system-ui`
    ctx.fillText(o.label+'.  '+(o.label==='A'?'4':(o.label==='B'?'3':'5')),cardX+14,y+h*.088)
    if(o.check){
      ctx.fillStyle='#4ade80'; ctx.font=`bold ${Math.round(h*.05)}px system-ui`
      ctx.textAlign='right'; ctx.fillText('✓',cardX+cardW-12,y+h*.088)
    }
  })
  ctx.textAlign='start'
}

function scene_tool_progress(ctx, w, h, t) {
  ctx.fillStyle='#0a0a18'; ctx.fillRect(0,0,w,h)
  const items=[
    {label:'Workshop 1', pct:.88, col:'#6366f1'},
    {label:'Workshop 2', pct:.52, col:'#8b5cf6'},
    {label:'Workshop 3', pct:.24, col:'#a78bfa'},
  ]
  const pulse=.85+.15*Math.sin(t*1.2)

  items.forEach((item,i)=>{
    const y=h*(.18+i*.26)
    ctx.fillStyle='rgba(255,255,255,.4)'; ctx.font=`${Math.round(h*.042)}px system-ui`
    ctx.textAlign='left'; ctx.fillText(item.label,w*.08,y)
    const pctLabel=Math.round(item.pct*100*(i===0?pulse:1))+'%'
    ctx.fillStyle=item.col; ctx.textAlign='right'; ctx.fillText(pctLabel,w*.92,y)

    const barY=y+h*.04, barH=h*.05, barW=w*.84
    ctx.fillStyle='rgba(255,255,255,.07)'; ctx.beginPath(); ctx.roundRect(w*.08,barY,barW,barH,barH/2); ctx.fill()
    const fillW=barW*item.pct*(i===0?Math.min(pulse,1):1)
    const gr=ctx.createLinearGradient(w*.08,0,w*.08+fillW,0)
    gr.addColorStop(0,item.col+'cc'); gr.addColorStop(1,item.col)
    ctx.fillStyle=gr; ctx.beginPath(); ctx.roundRect(w*.08,barY,fillW,barH,barH/2); ctx.fill()
  })

  // Total items badge
  const total=Math.floor(47+12*Math.sin(t*.2))
  ctx.fillStyle='rgba(99,102,241,.2)'; ctx.beginPath(); ctx.roundRect(w*.3,h*.82,w*.4,h*.1,10); ctx.fill()
  ctx.fillStyle='#a5b4fc'; ctx.font=`bold ${Math.round(h*.044)}px system-ui`
  ctx.textAlign='center'; ctx.fillText(total+' items learned',w*.5,h*.88)
  ctx.textAlign='start'
}

function scene_privacy(ctx, w, h, t) {
  ctx.fillStyle='#0a0a18'; ctx.fillRect(0,0,w,h)
  const cx=w*.5, pulse=1+.06*Math.sin(t*1.5)

  // Browser icon (top)
  const brX=cx-w*.18, brY=h*.08, brW=w*.36, brH=h*.15
  ctx.fillStyle='#1a1a2e'; ctx.beginPath(); ctx.roundRect(brX,brY,brW,brH,10); ctx.fill()
  ctx.strokeStyle='rgba(99,102,241,.35)'; ctx.lineWidth=1.2
  ctx.beginPath(); ctx.roundRect(brX,brY,brW,brH,10); ctx.stroke()
  ctx.fillStyle='rgba(255,255,255,.2)'; ctx.beginPath(); ctx.roundRect(brX+8,brY+h*.035,brW-16,h*.045,6); ctx.fill()
  ctx.fillStyle='rgba(255,255,255,.35)'; ctx.font=`${Math.round(h*.034)}px system-ui`
  ctx.textAlign='center'; ctx.fillText('Your Browser',cx,brY+h*.12)

  // Lock shield in center
  const lx=cx, ly=h*.44
  ctx.save(); ctx.translate(lx,ly); ctx.scale(pulse,pulse)
  // Shield
  ctx.fillStyle='rgba(99,102,241,.2)'
  ctx.beginPath()
  ctx.moveTo(0,-h*.14); ctx.lineTo(w*.12,-h*.08); ctx.lineTo(w*.12,h*.05)
  ctx.quadraticCurveTo(w*.12,h*.14,0,h*.16)
  ctx.quadraticCurveTo(-w*.12,h*.14,-w*.12,h*.05)
  ctx.lineTo(-w*.12,-h*.08); ctx.closePath(); ctx.fill()
  ctx.strokeStyle='#818cf8'; ctx.lineWidth=1.8
  ctx.beginPath()
  ctx.moveTo(0,-h*.14); ctx.lineTo(w*.12,-h*.08); ctx.lineTo(w*.12,h*.05)
  ctx.quadraticCurveTo(w*.12,h*.14,0,h*.16)
  ctx.quadraticCurveTo(-w*.12,h*.14,-w*.12,h*.05)
  ctx.lineTo(-w*.12,-h*.08); ctx.closePath(); ctx.stroke()
  // Lock icon
  ctx.strokeStyle='#a5b4fc'; ctx.lineWidth=2; ctx.lineCap='round'
  ctx.beginPath(); ctx.arc(0,-h*.01,h*.04,Math.PI,Math.PI*2); ctx.stroke()
  ctx.fillStyle='#a5b4fc'; ctx.beginPath(); ctx.roundRect(-h*.04,h*.01,h*.08,h*.06,4); ctx.fill()
  ctx.restore()

  // "No cloud" — crossed-out cloud symbol
  const cloudX=cx, cloudY=h*.76
  ctx.globalAlpha=.5
  ctx.strokeStyle='#f87171'; ctx.lineWidth=2
  ctx.beginPath(); ctx.arc(cloudX,cloudY,h*.055,0,Math.PI*2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cloudX-h*.04,cloudY-h*.04); ctx.lineTo(cloudX+h*.04,cloudY+h*.04); ctx.stroke()
  ctx.fillStyle='rgba(248,113,113,.15)'; ctx.beginPath(); ctx.arc(cloudX,cloudY,h*.055,0,Math.PI*2); ctx.fill()
  ctx.globalAlpha=1
  ctx.fillStyle='rgba(248,113,113,.6)'; ctx.font=`${Math.round(h*.032)}px system-ui`
  ctx.textAlign='center'; ctx.fillText('no server',cx,cloudY+h*.09)
  ctx.textAlign='start'
}

function scene_topics(ctx, w, h, t) {
  ctx.fillStyle='#0a0a18'; ctx.fillRect(0,0,w,h)
  const topics=[
    {icon:'🌍',y:.1},{icon:'🧮',y:.22},{icon:'🚗',y:.34},
    {icon:'🎵',y:.46},{icon:'💻',y:.58},{icon:'🔬',y:.70},
    {icon:'📜',y:.82},{icon:'🏥',y:.94},
  ]
  const highlight=Math.floor(t*.6)%topics.length
  ctx.textAlign='center'; ctx.textBaseline='middle'

  topics.forEach((tp,i)=>{
    const fly=Math.sin(t*.5+i*.8)*h*.012
    const active=i===highlight
    const x=w*.5+(i%2===0?-1:1)*w*.22
    const y=tp.y*h+fly
    const a=active?1:.45
    ctx.globalAlpha=a
    ctx.fillStyle=active?'rgba(99,102,241,.3)':'rgba(255,255,255,.05)'
    ctx.beginPath(); ctx.roundRect(x-22,y-16,44,32,10); ctx.fill()
    if(active){ctx.strokeStyle='#818cf8';ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect(x-22,y-16,44,32,10);ctx.stroke()}
    ctx.font=`${Math.round(h*.065)}px serif`
    ctx.fillStyle='#fff'; ctx.fillText(tp.icon,x,y)
    ctx.globalAlpha=1
  })

  drawFigure(ctx, w*.5, h*.97, h*.03, t, '#6366f1')
  ctx.textAlign='start'; ctx.textBaseline='alphabetic'
}

function scene_opensource(ctx, w, h, t) {
  ctx.fillStyle='#0D1117'; ctx.fillRect(0,0,w,h)
  // Terminal lines
  const lines=[
    {txt:'$ git clone openlearnapp', col:'#00FF41', delay:0},
    {txt:'Cloning into \'openlearnapp\'...', col:'rgba(255,255,255,.45)', delay:.8},
    {txt:'$ pnpm install', col:'#00FF41', delay:1.8},
    {txt:'✓ 159 modules', col:'#4ade80', delay:2.6},
    {txt:'$ pnpm dev', col:'#00FF41', delay:3.4},
    {txt:'➜ Local: http://localhost:5173', col:'#818cf8', delay:4.2},
  ]
  const loop=(t%7)
  ctx.font=`${Math.round(h*.046)}px monospace`
  ctx.textAlign='left'
  lines.forEach((l,i)=>{
    if(loop<l.delay) return
    const progress=Math.min(1,(loop-l.delay)/.3)
    const chars=Math.round(l.txt.length*progress)
    ctx.fillStyle=l.col; ctx.globalAlpha=.9
    ctx.fillText(l.txt.slice(0,chars),w*.06,h*(.15+i*.13))
  })
  // Blinking cursor
  const lastShown=lines.filter(l=>loop>=l.delay).pop()
  if(lastShown&&Math.sin(t*4)>0){
    const li=lines.indexOf(lastShown)
    const progress=Math.min(1,(loop-lastShown.delay)/.3)
    const chars=Math.round(lastShown.txt.length*progress)
    const cursorX=w*.06+ctx.measureText(lastShown.txt.slice(0,chars)).width+2
    ctx.fillStyle='#00FF41'; ctx.globalAlpha=1
    ctx.fillRect(cursorX,h*(.09+li*.13),2,h*.05)
  }
  ctx.globalAlpha=1
  ctx.textAlign='start'
}

// Background starfield (hero only)
const bgCanvas = ref(null)
function renderBg(ctx, w, h, t) {
  const sky=ctx.createLinearGradient(0,0,0,h)
  sky.addColorStop(0,'#07052A'); sky.addColorStop(.5,'#0E0B3D'); sky.addColorStop(1,'#130820')
  ctx.fillStyle=sky; ctx.fillRect(0,0,w,h)
  STARS.forEach(s=>{
    ctx.globalAlpha=.15+.55*Math.abs(Math.sin(t*s.sp+s.ph))
    ctx.fillStyle='#fff'
    ctx.beginPath(); ctx.arc(w*s.x,h*s.y*.6,s.r*.55,0,Math.PI*2); ctx.fill()
  }); ctx.globalAlpha=1
  ;[{x:.18,y:.35,r:160,c:'rgba(99,102,241,.07)'},{x:.82,y:.55,r:200,c:'rgba(139,92,246,.05)'}].forEach(o=>{
    const g=ctx.createRadialGradient(w*o.x,h*o.y,0,w*o.x,h*o.y,o.r)
    g.addColorStop(0,o.c); g.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h)
  })
  // Floating figure in hero
  drawFigure(ctx, w*.72, h*.72, h*.06, t, '#6366f1')
}

// Canvas pool
const pool = []
const RENDERERS = {
  pick_lang:      scene_pick_lang,
  start_workshop: scene_start_workshop,
  learn_track:    scene_learn_track,
  tool_audio:     scene_tool_audio,
  tool_quiz:      scene_tool_quiz,
  tool_progress:  scene_tool_progress,
  privacy:        scene_privacy,
  topics:         scene_topics,
  opensource:     scene_opensource,
}

function reg(el, key) {
  if (!el) return
  if (pool.find(e => e.el === el)) return
  const dpr=window.devicePixelRatio||1
  const pw=el.offsetWidth||200, ph=el.offsetHeight||160
  el.width=pw*dpr; el.height=ph*dpr
  const ctx=el.getContext('2d'); ctx.scale(dpr,dpr)
  pool.push({ el, ctx, w:pw, h:ph, key })
}

let rafId=null, t0=null
function loop(ts) {
  rafId=requestAnimationFrame(loop)
  if(!t0) t0=ts
  const t=(ts-t0)/1000

  // Hero background
  if (bgCanvas.value) {
    const el=bgCanvas.value
    if(!el._rdy){
      const dpr=window.devicePixelRatio||1
      el.width=el.offsetWidth*dpr; el.height=el.offsetHeight*dpr
      el._ctx=el.getContext('2d'); el._ctx.scale(dpr,dpr); el._rdy=true
    }
    renderBg(el._ctx,el.offsetWidth,el.offsetHeight,t)
  }

  // All scene canvases
  pool.forEach(item=>{
    const fn=RENDERERS[item.key]
    if(!fn) return
    item.ctx.clearRect(0,0,item.w,item.h)
    fn(item.ctx,item.w,item.h,t)
  })
}

onMounted(async () => {
  const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true
  if(isStandalone){
    const lang=selectedLanguage.value||localStorage.getItem('lastLearningLanguage')||'deutsch'
    router.replace({name:'workshop-overview',params:{learning:lang}}); return
  }
  if(Object.keys(availableContent.value).length===0) await loadAvailableContent()
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ rafId=requestAnimationFrame(loop) }))
})

onUnmounted(()=>{ if(rafId) cancelAnimationFrame(rafId); pool.length=0 })
</script>

<style scoped>
/* ── Root ─────────────────────────────────────────────────────────── */
.home-root {
  min-height: 100vh;
  background: #080810;
  color: #f4f4f5;
  font-family: system-ui, -apple-system, sans-serif;
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
  position: absolute; inset: 0; width: 100%; height: 100%; display: block;
}
.hero-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(7,5,42,.55) 0%, rgba(7,5,42,.75) 100%);
  pointer-events: none;
}
.hero-inner {
  position: relative; z-index: 1;
  max-width: 640px; margin: 0 auto;
  padding: 90px 24px 70px;
  text-align: center;
}
.hero-pill {
  display: inline-block; padding: 5px 16px; border-radius: 100px;
  border: 1px solid rgba(99,102,241,.4); background: rgba(99,102,241,.1);
  font-size: 12px; font-weight: 700; letter-spacing: 1px; color: #818cf8;
  margin-bottom: 20px;
}
.hero-h1 {
  font-size: clamp(28px, 5vw, 58px); font-weight: 900; letter-spacing: -1.5px;
  line-height: 1.08; color: #fff; margin-bottom: 16px;
}
.hero-p {
  font-size: 16px; color: rgba(255,255,255,.5); line-height: 1.65;
  margin-bottom: 32px; max-width: 460px; margin-left: auto; margin-right: auto;
}

/* Lang selector */
.hero-cta { display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; }
.lang-selector-wrap { position: relative; }
.lang-btn {
  display: flex; align-items: center; gap: 8px; padding: 11px 18px; border-radius: 12px;
  border: 1.5px solid rgba(99,102,241,.6); background: rgba(99,102,241,.12); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer; transition: background .2s;
}
.lang-btn:hover { background: rgba(99,102,241,.22); }
.lang-menu {
  position: absolute; top: calc(100% + 6px); left: 50%; transform: translateX(-50%);
  background: #12122a; border: 1px solid rgba(99,102,241,.3);
  border-radius: 12px; padding: 6px; min-width: 180px; z-index: 100;
  box-shadow: 0 8px 32px rgba(0,0,0,.65);
}
.lang-option {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 8px 12px; border: none; border-radius: 8px;
  background: transparent; color: rgba(255,255,255,.72); font-size: 13px;
  cursor: pointer; transition: background .15s;
}
.lang-option:hover, .lang-option.active { background: rgba(99,102,241,.25); color: #fff; }
.start-btn {
  display: flex; align-items: center; gap: 8px; padding: 11px 22px;
  border-radius: 12px; border: none; background: #6366f1;
  color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; transition: opacity .2s;
}
.start-btn:hover { opacity: .86; }
.drop-enter-active, .drop-leave-active { transition: opacity .15s, transform .15s; }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-6px) translateX(-50%); }

/* ── SHARED SECTION ───────────────────────────────────────────────── */
.content-sec { padding: 0; }
.content-sec.alt { background: rgba(255,255,255,.018); }
.sec-inner { max-width: 1060px; margin: 0 auto; padding: 80px 24px; }
.sec-h2 {
  font-size: clamp(22px, 3.5vw, 38px); font-weight: 900; letter-spacing: -1px;
  color: #fff; margin-bottom: 48px;
}
.sec-p { font-size: 15px; color: rgba(255,255,255,.42); line-height: 1.65; margin-bottom: 24px; }

/* ── ANIMATED WINDOW ─────────────────────────────────────────────── */
.anim-window {
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(99,102,241,.2);
  background: #0a0a18;
  box-shadow: 0 0 0 1px rgba(99,102,241,.08), 0 24px 64px rgba(0,0,0,.55);
  flex-shrink: 0;
}
.anim-window.small { width: 180px; height: 140px; }
.anim-window.tall  { width: 300px; min-height: 340px; }
.anim-window.cta-anim { width: 340px; height: 240px; }
.anim-canvas { width: 100%; height: 100%; display: block; }

/* ── HOW IT WORKS — step rows ─────────────────────────────────────── */
.steps-list { display: flex; flex-direction: column; gap: 64px; }
.step-row {
  display: flex; align-items: center; gap: 48px;
}
.step-row.reverse { flex-direction: row-reverse; }
.step-row .anim-window {
  width: 340px; height: 240px; flex-shrink: 0;
}
.step-text { flex: 1; }
.step-num {
  width: 36px; height: 36px; border-radius: 50%; background: #6366f1;
  color: #fff; font-size: 16px; font-weight: 900;
  display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
}
.step-title { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 8px; }
.step-desc  { font-size: 15px; color: rgba(255,255,255,.42); line-height: 1.65; }

/* ── TOOLS ───────────────────────────────────────────────────────── */
.tools-grid { display: flex; flex-direction: column; gap: 32px; }
.tool-row   { display: flex; align-items: center; gap: 28px; }
.tool-text  { flex: 1; }
.tool-title { font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 6px; }
.tool-desc  { font-size: 14px; color: rgba(255,255,255,.4); line-height: 1.6; }

/* ── SPLIT SECTION (Privacy, Topics) ─────────────────────────────── */
.split-sec  { display: flex; align-items: center; gap: 56px; }
.split-text { flex: 1; }
.privacy-list { display: flex; flex-direction: column; gap: 20px; }
.privacy-item {}
.privacy-title { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.privacy-desc  { font-size: 14px; color: rgba(255,255,255,.4); line-height: 1.6; }

/* ── TOPIC CHIPS ─────────────────────────────────────────────────── */
.topic-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
.topic-chip  {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 100px;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08);
  font-size: 13px; color: rgba(255,255,255,.7);
}

/* ── CTA ─────────────────────────────────────────────────────────── */
.cta-sec { border-top: 1px solid rgba(255,255,255,.06); }
.cta-inner {
  display: flex; align-items: center; gap: 56px;
}
.cta-text { flex: 1; }
.cta-h2 { font-size: clamp(22px,3.5vw,36px); font-weight: 900; color: #fff; margin-bottom: 12px; }
.cta-p  { font-size: 15px; color: rgba(255,255,255,.42); margin-bottom: 28px; line-height: 1.6; }
.cta-btns { display: flex; gap: 12px; flex-wrap: wrap; }
.btn-primary {
  padding: 12px 24px; border-radius: 12px; background: #6366f1; color: #fff;
  font-size: 14px; font-weight: 700; text-decoration: none; transition: opacity .2s;
}
.btn-primary:hover { opacity: .84; }
.btn-ghost {
  padding: 12px 24px; border-radius: 12px;
  border: 1.5px solid rgba(255,255,255,.14); color: rgba(255,255,255,.65);
  font-size: 14px; font-weight: 600; text-decoration: none; transition: border-color .2s;
}
.btn-ghost:hover { border-color: rgba(255,255,255,.36); color: #fff; }

/* ── RESPONSIVE ──────────────────────────────────────────────────── */
@media (max-width: 800px) {
  .step-row, .step-row.reverse, .split-sec, .cta-inner {
    flex-direction: column; gap: 28px;
  }
  .step-row .anim-window { width: 100%; height: 200px; }
  .anim-window.tall   { width: 100%; min-height: 220px; }
  .anim-window.cta-anim { width: 100%; height: 180px; }
  .tool-row { gap: 16px; }
  .anim-window.small { width: 120px; height: 100px; flex-shrink: 0; }
}
@media (max-width: 480px) {
  .sec-h2 { margin-bottom: 28px; }
  .steps-list { gap: 40px; }
}
</style>
