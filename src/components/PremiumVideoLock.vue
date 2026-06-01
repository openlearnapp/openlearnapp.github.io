<template>
  <div
    class="pvl"
    :style="boxStyle"
    role="button"
    tabindex="0"
    :aria-label="label"
    @click.stop="$emit('unlock')"
    @keydown.enter.prevent="$emit('unlock')"
    @keydown.space.prevent="$emit('unlock')">
    <img v-if="previewImage" :src="previewImage" :alt="label" class="pvl__bg-img" />
    <div v-else class="pvl__bg-fallback" aria-hidden="true">
      <div class="pvl__aurora"></div>
    </div>
    <div class="pvl__veil" aria-hidden="true"></div>
    <div class="pvl__lock" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="5" y="11" width="14" height="9" rx="2"/>
        <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
      </svg>
    </div>
    <div class="pvl__hint">{{ label }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  previewImage: { type: String, default: '' },
  accent: { type: String, default: '#22d3ee' },
  accentSoft: { type: String, default: '#67e8f9' },
  label: { type: String, default: 'Video freischalten' }
})

defineEmits(['unlock'])

const boxStyle = computed(() => ({
  '--pvl-a': props.accent,
  '--pvl-b': props.accentSoft
}))
</script>

<style scoped>
.pvl {
  --pvl-a: #22d3ee;
  --pvl-b: #67e8f9;
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 0.6rem;
  overflow: hidden;
  cursor: pointer;
  isolation: isolate;
  background: rgb(15, 23, 42);
  border: 1px solid color-mix(in oklab, var(--pvl-a) 28%, rgba(255,255,255,0.06));
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}
.pvl:hover {
  transform: translateY(-2px);
  border-color: color-mix(in oklab, var(--pvl-a) 60%, transparent);
  box-shadow: 0 14px 36px -14px color-mix(in oklab, var(--pvl-a) 70%, transparent);
}
.pvl:focus-visible {
  outline: 2px solid var(--pvl-b);
  outline-offset: 3px;
}

.pvl__bg-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  filter: saturate(0.85) brightness(0.6);
  z-index: 0;
}

.pvl__bg-fallback {
  position: absolute; inset: 0;
  z-index: 0;
  background: linear-gradient(140deg, #0a0e22 0%, #1a1140 55%, #0a0e22 100%);
}

.pvl__aurora {
  position: absolute; inset: -30%;
  background:
    radial-gradient(40% 50% at 20% 30%, color-mix(in oklab, var(--pvl-a) 55%, transparent), transparent 70%),
    radial-gradient(35% 50% at 80% 70%, color-mix(in oklab, var(--pvl-b) 40%, transparent), transparent 72%);
  filter: blur(36px);
  animation: pvlAurora 22s ease-in-out infinite alternate;
}

.pvl__veil {
  position: absolute; inset: 0;
  z-index: 1;
  background:
    linear-gradient(135deg, color-mix(in oklab, var(--pvl-a) 20%, transparent), transparent 60%),
    linear-gradient(0deg, rgba(0,0,0,0.5), rgba(0,0,0,0.15));
  pointer-events: none;
}

.pvl__lock {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  width: 64px; height: 64px;
  display: grid; place-items: center;
  color: var(--pvl-b);
  border-radius: 999px;
  background: radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--pvl-a) 35%, transparent), color-mix(in oklab, var(--pvl-a) 8%, transparent) 70%);
  box-shadow:
    0 0 18px color-mix(in oklab, var(--pvl-a) 60%, transparent),
    0 0 36px color-mix(in oklab, var(--pvl-a) 30%, transparent),
    inset 0 0 0 1px color-mix(in oklab, var(--pvl-b) 50%, transparent);
  filter: drop-shadow(0 0 8px color-mix(in oklab, var(--pvl-a) 70%, transparent));
  animation: pvlFlicker 3.6s ease-in-out infinite;
  pointer-events: none;
}

.pvl__hint {
  position: absolute;
  bottom: 14px; left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #fff;
  background: rgba(8, 12, 28, 0.7);
  border: 1px solid color-mix(in oklab, var(--pvl-a) 45%, transparent);
  backdrop-filter: blur(8px);
}

@keyframes pvlAurora {
  0% { transform: translate3d(-3%, -3%, 0) rotate(0deg); }
  100% { transform: translate3d(3%, 4%, 0) rotate(6deg); }
}
@keyframes pvlFlicker {
  0%, 100% { opacity: 0.85; }
  42% { opacity: 1; }
  55% { opacity: 0.7; }
  65% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .pvl__aurora, .pvl__lock { animation: none; }
}
</style>
