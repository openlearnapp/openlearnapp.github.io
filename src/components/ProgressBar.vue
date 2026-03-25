<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-muted-foreground">
        {{ completed }}/{{ total }} {{ label }}
      </span>
      <span class="text-sm font-semibold text-primary">
        {{ percentage }}%
      </span>
    </div>
    <div class="w-full h-2.5 bg-muted rounded-full overflow-hidden">
      <div
        class="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out"
        :style="{ width: percentage + '%' }">
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  completed: { type: Number, required: true },
  total: { type: Number, required: true },
  label: { type: String, default: 'completed' }
})

const percentage = computed(() => {
  if (props.total === 0) return 0
  return Math.round((props.completed / props.total) * 100)
})
</script>
