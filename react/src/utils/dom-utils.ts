// /react/src/utils/dom-utils.ts

import { FeedbackController, ScrollOptions } from '@/types'

export const createDOMUtils = () => {

  /*********************
   * Private Functions *
   *********************/

  const fallbackCopyToClipboard = (text: string): boolean => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'

    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      return successful
    } catch (error) {
      document.body.removeChild(textArea)
      return false
    }
  }

  /********************
   * Public Functions *
   ********************/

  // copy text to clipboard with fallback
  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!text) return false

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        return true
      } else {
        // fallback for older browsers
        return fallbackCopyToClipboard(text)
      }
    } catch (error) {
      console.warn('Clipboard copy failed:', error)
      return fallbackCopyToClipboard(text)
    }
  }

  const isValidElement = (element: Element | null): element is Element => {
    return element !== null && element.nodeType === Node.ELEMENT_NODE
  }

  // helper to restore element to original state
  const restoreElementState = (
    element: Element | null,
    originalState: { text: string; className: string; width: number }
  ): void => {
    if (!isValidElement(element) || !originalState) return

    const el = element as HTMLElement
    el.textContent = originalState.text
    el.className = originalState.className
    el.style.width = ''
  }

  // smooth scroll to element
  const scrollToElement = (element: Element | null, options: ScrollOptions = {}): boolean => {
    if (!isValidElement(element)) return false

    const defaultOptions: ScrollIntoViewOptions = {
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    }

    element.scrollIntoView({ ...defaultOptions, ...options })
    return true
  }

  // show temporary feedback on element with cancellation support
  const showTemporaryFeedback = (
    element: Element | null,
    message: string,
    duration: number = 1000
  ): FeedbackController | null => {
    if (!isValidElement(element)) return null

    const el = element as HTMLElement
    const originalState = {
      text: el.textContent || '',
      className: el.className,
      width: el.offsetWidth
    }

    // apply feedback styling
    el.style.width = `${originalState.width}px`
    el.textContent = message
    el.className = 'copy-btn text-green-400 font-medium text-sm min-w-[3rem]'

    // return object w/ timeout ID and revert callback
    const timeoutId = setTimeout(() => {
      restoreElementState(element, originalState)
    }, duration)

    return {
      timeoutId,
      revert: () => {
        clearTimeout(timeoutId)
        restoreElementState(element, originalState)
      }
    }
  }

  return {
    copyToClipboard,
    isValidElement,
    restoreElementState,
    scrollToElement,
    showTemporaryFeedback,
  }
}

export const domUtils = createDOMUtils()
