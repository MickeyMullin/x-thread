// /react/src/utils/animation-utils.ts

import { EasingFunctions } from '@/types'

export const createAnimationUtils = () => {
  // animate a numeric value
  const animateValue = (
    from: number,
    to: number,
    duration: number,
    callback: (currentValue: number, progress: number) => void,
    easing: keyof EasingFunctions = 'easeOutQuad'
  ): void => {
    const startTime = performance.now()
    const easeFn = easingFunctions[easing]

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeFn(progress)
      const currentValue = from + (to - from) * easedProgress

      callback(currentValue, progress)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }

  const easingFunctions: EasingFunctions = {
    linear: (t: number) => t,
    easeInQuad: (t: number) => t * t,
    easeOutQuad: (t: number) => t * (2 - t),
    easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t: number) => t * t * t,
    easeOutCubic: (t: number) => (--t) * t * t + 1,
    easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
  }

  // fade element in/out
  const fadeElement = (
    element: Element | null,
    direction: 'in' | 'out' = 'in',
    duration: number = 300
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!element) {
        resolve(false)
        return
      }

      const el = element as HTMLElement
      const startOpacity = direction === 'in' ? 0 : 1
      const endOpacity = direction === 'in' ? 1 : 0

      el.style.opacity = startOpacity.toString()

      if (direction === 'in') {
        el.style.display = 'block'
      }

      animateValue(startOpacity, endOpacity, duration, (value) => {
        el.style.opacity = value.toString()
      })

      setTimeout(() => {
        if (direction === 'out') {
          el.style.display = 'none'
        }
        resolve(true)
      }, duration)
    })
  }

  return {
    animateValue,
    easingFunctions,
    fadeElement,
  }
}

export const animationUtils = createAnimationUtils()
