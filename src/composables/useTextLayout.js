import { ref, onMounted, onUnmounted } from 'vue'
import { prepare, layout } from '@chenglou/pretext'

const containerWidth = ref(window.innerWidth)
const containerHeight = ref(window.innerHeight)

function onResize() {
  containerWidth.value = window.innerWidth
  containerHeight.value = window.innerHeight
}

export function useTextLayout() {
  onMounted(() => window.addEventListener('resize', onResize))
  onUnmounted(() => window.removeEventListener('resize', onResize))

  /**
   * Calculate how text fits in available space.
   * Returns { height, lineCount, fontSize, needsPagination }
   */
  function measureText(text, options = {}) {
    const {
      maxWidth = containerWidth.value - 48, // 24px padding each side
      maxHeight = containerHeight.value * 0.4,
      baseFontSize = 20,
      lineHeightRatio = 1.6,
      fontFamily = 'Georgia, serif'
    } = options

    let fontSize = baseFontSize
    let result = null

    // Try with base size first, shrink if needed
    for (let attempt = 0; attempt < 3; attempt++) {
      const lineHeight = Math.round(fontSize * lineHeightRatio)
      const font = `${fontSize}px ${fontFamily}`
      const handle = prepare(text, { font, lineHeight })
      result = layout(handle, maxWidth)

      if (result.height <= maxHeight) break
      fontSize = Math.max(14, fontSize - 2)
    }

    return {
      height: result?.height || 0,
      lineCount: result?.lineCount || 0,
      fontSize,
      lineHeight: Math.round(fontSize * lineHeightRatio),
      needsPagination: (result?.height || 0) > maxHeight
    }
  }

  /**
   * Determine layout variant based on content.
   * - 'image-text': image on top, text below (short text + image)
   * - 'text-only': full page text (long text, no image)
   * - 'image-only': fullscreen image (no text or very short)
   * - 'image-beside': image left, text right (desktop + medium text)
   */
  function getLayoutVariant(text, hasImage) {
    if (!text && hasImage) return 'image-only'
    if (!hasImage) return 'text-only'

    const textLength = text?.length || 0
    const isWide = containerWidth.value > 768

    if (textLength < 30) return 'image-only'
    if (isWide && textLength > 80) return 'image-beside'
    return 'image-text'
  }

  return {
    measureText,
    getLayoutVariant,
    containerWidth,
    containerHeight
  }
}
