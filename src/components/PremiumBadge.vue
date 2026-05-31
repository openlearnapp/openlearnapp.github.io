<template>
  <span class="premium-badge" :style="badgeStyle" :title="title">
    <span class="premium-badge__shimmer" aria-hidden="true"></span>
    <svg class="premium-badge__icon" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
      <path d="M12 2 14.5 8.5 21.5 9 16 13.5 17.5 20.5 12 17 6.5 20.5 8 13.5 2.5 9 9.5 8.5z" fill="currentColor"/>
    </svg>
    <span class="premium-badge__label"><slot>Premium</slot></span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  accent: { type: String, default: '#7c3aed' },
  accentSoft: { type: String, default: '#a78bfa' },
  title: { type: String, default: '' }
})

const badgeStyle = computed(() => ({
  '--premium-a': props.accent,
  '--premium-b': props.accentSoft
}))
</script>

<style scoped>
.premium-badge {
  --premium-a: #7c3aed;
  --premium-b: #a78bfa;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
  background: linear-gradient(110deg, var(--premium-a), var(--premium-b), #22d3ee, var(--premium-a));
  background-size: 300% 100%;
  animation: premiumShift 6s ease-in-out infinite;
  box-shadow: 0 4px 18px -6px color-mix(in oklab, var(--premium-a) 70%, transparent),
              0 0 0 1px color-mix(in oklab, #fff 25%, transparent) inset;
  overflow: hidden;
  user-select: none;
}

.premium-badge__shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 25%, rgba(255,255,255,0.5) 50%, transparent 75%);
  transform: translateX(-100%);
  animation: premiumSheen 3.4s ease-in-out infinite;
  pointer-events: none;
}

.premium-badge__icon {
  position: relative;
  filter: drop-shadow(0 0 4px rgba(255,255,255,0.6));
}

.premium-badge__label {
  position: relative;
}

@keyframes premiumShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes premiumSheen {
  0%, 60% { transform: translateX(-120%); }
  85%, 100% { transform: translateX(120%); }
}
</style>
