// /react/src/utils/toast-utils.ts

import { FADE_DELAY, TOAST_DURATION } from './constants'

export const createToastUtils = () => {
  // show toast notification
  const showToast = (message: string, duration: number = TOAST_DURATION): void => {
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 left-64 bg-blue-900 border border-blue-700 text-blue-200 px-4 py-2 rounded-lg shadow-lg text-sm opacity-0 transform -translate-y-2 transition-all duration-300 ease-out z-50 min-w-48'
    toast.textContent = message

    document.body.appendChild(toast)

    // fade in
    setTimeout(() => {
      toast.style.opacity = '1'
      toast.style.transform = 'translateY(0)'
    }, 10)

    // fade out and remove
    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transform = 'translateY(-10px)'
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast)
        }
      }, FADE_DELAY)
    }, duration)
  }

  return {
    showToast,
  }
}

export const toastUtils = createToastUtils()
