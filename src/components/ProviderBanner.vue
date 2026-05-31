<template>
  <div class="provider-banner" :style="bannerStyle">
    <div class="provider-banner__bg" aria-hidden="true"></div>
    <div class="provider-banner__grid" aria-hidden="true"></div>
    <div class="provider-banner__particles" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span><span></span>
    </div>

    <div class="provider-banner__row">
      <div class="provider-banner__brand">
        <img v-if="provider.logo" :src="provider.logo" :alt="provider.name" class="provider-banner__logo" />
        <div v-else class="provider-banner__brand-text">{{ provider.name }}</div>
        <div class="provider-banner__pill">
          <span class="provider-banner__pill-dot"></span>
          {{ poweredBy }} <strong>{{ provider.name }}</strong>
        </div>
      </div>

      <div v-if="unlocked" class="provider-banner__unlocked">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
        <span>{{ unlockedLabel }}</span>
      </div>
    </div>

    <h2 class="provider-banner__headline">{{ provider.headline || provider.tagline || provider.name }}</h2>
    <p v-if="provider.pitch" class="provider-banner__pitch">{{ provider.pitch }}</p>

    <ul v-if="Array.isArray(provider.bullets) && provider.bullets.length" class="provider-banner__bullets">
      <li v-for="b in provider.bullets" :key="b">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
        <span>{{ b }}</span>
      </li>
    </ul>

    <div class="provider-banner__cta" v-if="!unlocked">
      <div class="provider-banner__price-block" v-if="provider.price_display">
        <div class="provider-banner__price">{{ provider.price_display }}</div>
        <div class="provider-banner__price-note" v-if="provider.price_note">{{ provider.price_note }}</div>
      </div>
      <button type="button" class="provider-banner__btn provider-banner__btn--primary" @click="$emit('buy')">
        <span>{{ buyLabel }}</span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
        </svg>
      </button>
      <button v-if="showDemo" type="button" class="provider-banner__btn provider-banner__btn--ghost" @click="$emit('demo-unlock')" :title="demoTitle">
        {{ demoLabel }}
      </button>
    </div>

    <div class="provider-banner__cta" v-else>
      <button type="button" class="provider-banner__btn provider-banner__btn--ghost" @click="$emit('lock-again')">
        {{ relockLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  provider: { type: Object, required: true },
  unlocked: { type: Boolean, default: false },
  showDemo: { type: Boolean, default: true },
  poweredBy: { type: String, default: 'Angeboten von' },
  buyLabel: { type: String, default: 'Kurs freischalten' },
  demoLabel: { type: String, default: 'Demo entsperren' },
  demoTitle: { type: String, default: 'Schaltet alle Lektionen lokal frei — nur zum Anschauen.' },
  unlockedLabel: { type: String, default: 'Freigeschaltet' },
  relockLabel: { type: String, default: 'Demo zurücksetzen' }
})

defineEmits(['buy', 'demo-unlock', 'lock-again'])

const bannerStyle = computed(() => ({
  '--prov-a': props.provider?.accent_color || '#7c3aed',
  '--prov-b': props.provider?.accent_color_soft || '#a78bfa'
}))
</script>

<style scoped>
.provider-banner {
  --prov-a: #7c3aed;
  --prov-b: #a78bfa;
  position: relative;
  border-radius: 1.4rem;
  padding: 1.5rem 1.5rem 1.3rem 1.5rem;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(140deg, #0b1020 0%, #1a1240 55%, #0b1020 100%);
  border: 1px solid color-mix(in oklab, var(--prov-a) 35%, rgba(255,255,255,0.05));
  box-shadow: 0 24px 60px -28px color-mix(in oklab, var(--prov-a) 70%, transparent);
  isolation: isolate;
}

.provider-banner__bg {
  position: absolute;
  inset: -30%;
  background:
    radial-gradient(45% 55% at 18% 20%, color-mix(in oklab, var(--prov-a) 70%, transparent), transparent 70%),
    radial-gradient(35% 50% at 85% 80%, color-mix(in oklab, var(--prov-b) 55%, transparent), transparent 72%),
    radial-gradient(28% 38% at 65% 15%, rgba(34, 211, 238, 0.5), transparent 70%);
  filter: blur(34px);
  animation: provAurora 22s ease-in-out infinite alternate;
  z-index: 0;
}

.provider-banner__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 28px 28px;
  mask: linear-gradient(170deg, rgba(0,0,0,0.5) 0%, transparent 70%);
  z-index: 0;
}

.provider-banner__particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.provider-banner__particles span {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: color-mix(in oklab, var(--prov-b) 70%, #fff);
  filter: blur(0.4px);
  opacity: 0.7;
  animation: provFloat 9s ease-in-out infinite;
}
.provider-banner__particles span:nth-child(1) { top: 18%; left: 10%; animation-delay: 0s; }
.provider-banner__particles span:nth-child(2) { top: 40%; left: 28%; animation-delay: 1.2s; }
.provider-banner__particles span:nth-child(3) { top: 70%; left: 22%; animation-delay: 2.4s; }
.provider-banner__particles span:nth-child(4) { top: 28%; left: 78%; animation-delay: 0.8s; }
.provider-banner__particles span:nth-child(5) { top: 60%; left: 85%; animation-delay: 1.8s; }
.provider-banner__particles span:nth-child(6) { top: 82%; left: 60%; animation-delay: 3.0s; }

.provider-banner__row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-bottom: 0.9rem;
  flex-wrap: wrap;
}

.provider-banner__brand {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.provider-banner__logo {
  height: 38px;
  width: auto;
  background: rgba(255,255,255,0.92);
  border-radius: 10px;
  padding: 4px 8px;
}

.provider-banner__brand-text {
  font-weight: 800;
  letter-spacing: 0.5px;
  font-size: 1.05rem;
}

.provider-banner__pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: 0.72rem;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.14);
  color: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
}

.provider-banner__pill strong { color: #fff; }

.provider-banner__pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--prov-b);
  box-shadow: 0 0 8px var(--prov-b);
  animation: provBlink 1.6s ease-in-out infinite;
}

.provider-banner__unlocked {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #6ee7b7;
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(110, 231, 183, 0.4);
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
}

.provider-banner__headline {
  position: relative;
  z-index: 1;
  font-size: clamp(1.3rem, 2.1vw, 1.7rem);
  font-weight: 800;
  line-height: 1.18;
  margin: 0 0 0.35rem 0;
  background: linear-gradient(120deg, #fff 30%, color-mix(in oklab, var(--prov-b) 80%, #fff) 70%, #67e8f9);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.01em;
}

.provider-banner__pitch {
  position: relative;
  z-index: 1;
  margin: 0 0 0.95rem 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgba(255,255,255,0.78);
  max-width: 60ch;
}

.provider-banner__bullets {
  position: relative;
  z-index: 1;
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.45rem 1rem;
}

.provider-banner__bullets li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.86rem;
  color: rgba(255,255,255,0.85);
}

.provider-banner__bullets li svg {
  color: var(--prov-b);
  flex-shrink: 0;
}

.provider-banner__cta {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.provider-banner__price-block {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  margin-right: 0.4rem;
}

.provider-banner__price {
  font-weight: 800;
  font-size: 1.5rem;
  letter-spacing: -0.01em;
}

.provider-banner__price-note {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.6);
  margin-top: 0.2rem;
}

.provider-banner__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 1.1rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.provider-banner__btn--primary {
  color: #fff;
  background: linear-gradient(120deg, var(--prov-a), var(--prov-b));
  box-shadow: 0 12px 28px -10px color-mix(in oklab, var(--prov-a) 80%, transparent);
}

.provider-banner__btn--primary:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 16px 36px -12px color-mix(in oklab, var(--prov-a) 90%, transparent);
}

.provider-banner__btn--ghost {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.16);
  color: rgba(255,255,255,0.9);
  backdrop-filter: blur(8px);
}

.provider-banner__btn--ghost:hover {
  background: rgba(255,255,255,0.14);
}

@keyframes provAurora {
  0% { transform: translate3d(-3%, -3%, 0) rotate(0deg); }
  100% { transform: translate3d(3%, 4%, 0) rotate(6deg); }
}

@keyframes provBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes provFloat {
  0%, 100% { transform: translateY(0) translateX(0); opacity: 0.6; }
  50% { transform: translateY(-14px) translateX(6px); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .provider-banner__bg,
  .provider-banner__particles span { animation: none; }
}
</style>
