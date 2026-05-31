<template>
  <div
    class="locked-wrap"
    role="button"
    tabindex="0"
    :aria-label="`${lesson?.title || ''} — ${lockedLabel}`"
    @click.capture.stop="$emit('unlock')"
    @keydown.enter.prevent="$emit('unlock')"
    @keydown.space.prevent="$emit('unlock')">

    <!-- Real lesson card — same look as unlocked lessons -->
    <LessonCard
      :lesson="lesson"
      :status="status"
      :is-favorite="isFavorite"
      :is-next="false"
      :image-url="imageUrl"
      :answered-count="0"
      :learned-item-count="0"
      :next-label="nextLabel"
      :sections-label="sectionsLabel"
      :examples-label="examplesLabel"
      :quizzes-label="quizzesLabel"
      :audio-label="audioLabel"
      :video-label="videoLabel"
      :add-favorite-label="addFavoriteLabel"
      :remove-favorite-label="removeFavoriteLabel"
      :mark-complete-label="markCompleteLabel"
      :mark-incomplete-label="markIncompleteLabel"
      :items-label="itemsLabel" />

    <!-- Pointer blocker so internal buttons can't fire -->
    <div class="locked-wrap__block" aria-hidden="true"></div>

    <!-- Subtle dim layer on the thumbnail so the lock reads cleanly -->
    <div class="locked-wrap__veil" aria-hidden="true"></div>

    <!-- Glowing cyan lock — centered on the lesson thumbnail, slow flicker -->
    <div class="locked-wrap__lock" :title="lockedLabel" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="5" y="11" width="14" height="9" rx="2"/>
        <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
      </svg>
    </div>
  </div>
</template>

<script setup>
import LessonCard from './LessonCard.vue'

defineProps({
  lesson: { type: Object, required: true },
  status: { type: String, default: 'open' },
  isFavorite: { type: Boolean, default: false },
  imageUrl: { type: String, default: '' },
  lockedLabel: { type: String, default: 'Mit Kauf freigeschaltet' },
  nextLabel: { type: String, default: '' },
  sectionsLabel: { type: String, default: '' },
  examplesLabel: { type: String, default: '' },
  quizzesLabel: { type: String, default: '' },
  audioLabel: { type: String, default: '' },
  videoLabel: { type: String, default: '' },
  addFavoriteLabel: { type: String, default: '' },
  removeFavoriteLabel: { type: String, default: '' },
  markCompleteLabel: { type: String, default: '' },
  markIncompleteLabel: { type: String, default: '' },
  itemsLabel: { type: String, default: '' }
})

defineEmits(['unlock'])
</script>

<style scoped>
.locked-wrap {
  position: relative;
  cursor: pointer;
  border-radius: 1rem;
  isolation: isolate;
}

.locked-wrap:focus-visible {
  outline: 2px solid #22d3ee;
  outline-offset: 3px;
  border-radius: 1rem;
}

/* Transparent click blocker — eats clicks on internal buttons (star, mark-complete)
   so the whole card behaves like one big "unlock" button. */
.locked-wrap__block {
  position: absolute;
  inset: 0;
  z-index: 5;
  border-radius: inherit;
  cursor: pointer;
  background: transparent;
}

/* Dim layer that sits ONLY over the lesson thumbnail (first 80x80 / 96x96 of the card).
   Skips the 4px accent bar on the left. Keeps the rest of the card untouched. */
.locked-wrap__veil {
  position: absolute;
  top: 0;
  left: 4px;
  width: 80px;
  height: 80px;
  z-index: 4;
  border-radius: 1rem 0 0 1rem;
  background:
    radial-gradient(circle at 50% 50%, rgba(8, 47, 73, 0.25), rgba(0, 0, 0, 0.45) 75%);
  backdrop-filter: saturate(0.9) brightness(0.85);
  -webkit-backdrop-filter: saturate(0.9) brightness(0.85);
  pointer-events: none;
}
@media (min-width: 640px) {
  .locked-wrap__veil { width: 96px; height: 96px; }
}

/* Cyan glowing lock — centered on the thumbnail */
.locked-wrap__lock {
  position: absolute;
  top: 40px;
  left: calc(4px + 40px);
  transform: translate(-50%, -50%);
  z-index: 6;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  color: #67e8f9;
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.42), rgba(34, 211, 238, 0.08) 70%);
  box-shadow:
    0 0 14px rgba(34, 211, 238, 0.5),
    0 0 28px rgba(34, 211, 238, 0.28),
    inset 0 0 0 1px rgba(103, 232, 249, 0.5);
  filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.7));
  animation: lockGlowFlicker 3.6s ease-in-out infinite;
  pointer-events: none;
}
@media (min-width: 640px) {
  .locked-wrap__lock {
    top: 48px;
    left: calc(4px + 48px);
    width: 44px;
    height: 44px;
  }
}

@keyframes lockGlowFlicker {
  0%, 100% {
    opacity: 0.85;
    box-shadow:
      0 0 10px rgba(34, 211, 238, 0.4),
      0 0 22px rgba(34, 211, 238, 0.22),
      inset 0 0 0 1px rgba(103, 232, 249, 0.42);
  }
  42% {
    opacity: 1;
    box-shadow:
      0 0 18px rgba(34, 211, 238, 0.7),
      0 0 36px rgba(34, 211, 238, 0.4),
      inset 0 0 0 1px rgba(103, 232, 249, 0.7);
  }
  55% {
    opacity: 0.7;
  }
  65% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .locked-wrap__lock { animation: none; }
}
</style>
