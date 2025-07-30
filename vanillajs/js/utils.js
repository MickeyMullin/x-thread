// /js/utils.js

// animation utilities factory
const createAnimationUtils = () => {
  // animate a numeric value
  const animateValue = (from, to, duration, callback, easing = 'easeOutQuad') => {
    const startTime = performance.now()
    const easeFn = easingFunctions[easing] || easingFunctions.easeOutQuad

    const animate = (currentTime) => {
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

  // helper for easing functions
  const easingFunctions = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
  }

  // fade element in/out
  const fadeElement = (element, direction = 'in', duration = 300) => {
    return new Promise((resolve) => {
      if (!element) {
        resolve(false)
        return
      }

      const startOpacity = direction === 'in' ? 0 : 1
      const endOpacity = direction === 'in' ? 1 : 0

      element.style.opacity = startOpacity

      if (direction === 'in') {
        element.style.display = 'block'
      }

      animateValue(startOpacity, endOpacity, duration, (value) => {
        element.style.opacity = value
      })

      setTimeout(() => {
        if (direction === 'out') {
          element.style.display = 'none'
        }
        resolve(true)
      }, duration)
    })
  }

  // slide element in/out
  const slideElement = (element, direction = 'down', duration = 300) => {
    return new Promise((resolve) => {
      if (!element) {
        resolve(false)
        return
      }

      const isVertical = direction === 'up' || direction === 'down'
      const property = isVertical ? 'maxHeight' : 'maxWidth'
      const dimension = isVertical ? element.scrollHeight : element.scrollWidth

      if (direction === 'down' || direction === 'right') {
        element.style[property] = '0px'
        element.style.display = 'block'

        animateValue(0, dimension, duration, (value) => {
          element.style[property] = `${value}px`
        })
      } else {
        animateValue(dimension, 0, duration, (value) => {
          element.style[property] = `${value}px`
        })
      }

      setTimeout(() => {
        if (direction === 'up' || direction === 'left') {
          element.style.display = 'none'
        }
        element.style[property] = ''
        resolve(true)
      }, duration)
    })
  }

  // public API
  return {
    animateValue,
    easingFunctions,
    fadeElement,
    slideElement,
  }
}

// DOM manipulation utilities factory
const createDOMUtils = () => {
  // private helper for element validation
  const isValidElement = (element) => {
    return element && element.nodeType === Node.ELEMENT_NODE
  }

  // batch add event listeners
  const addEventListeners = (element, eventMap) => {
    if (!isValidElement(element)) return []

    const cleanupFunctions = []

    Object.entries(eventMap).forEach(([event, handler]) => {
      const cleanup = addEventListenerWithCleanup(element, event, handler)
      if (cleanup) cleanupFunctions.push(cleanup)
    })

    // return function to cleanup all listeners
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup())
    }
  }

  // add event listener with cleanup
  const addEventListenerWithCleanup = (element, event, handler, options = {}) => {
    if (!isValidElement(element)) return null

    element.addEventListener(event, handler, options)

    // return cleanup function
    return () => {
      element.removeEventListener(event, handler, options)
    }
  }

  // copy text to clipboard with fallback
  const copyToClipboard = async (text) => {
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

  // create element with attributes and content
  const createElement = (tag, attributes = {}, content = '') => {
    const element = document.createElement(tag)

    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue
        })
      } else {
        element.setAttribute(key, value)
      }
    })

    if (content) {
      if (typeof content === 'string') {
        element.textContent = content
      } else if (isValidElement(content)) {
        element.appendChild(content)
      }
    }

    return element
  }

  // fallback clipboard method
  const fallbackCopyToClipboard = (text) => {
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

  // find elements by various selectors
  const findElements = (selector, context = document) => {
    try {
      return Array.from(context.querySelectorAll(selector))
    } catch (error) {
      console.warn('Invalid selector:', selector)
      return []
    }
  }

  // helper to restore element to original state
  const restoreElementState = (element, originalState) => {
    if (!isValidElement(element) || !originalState) return

    element.textContent = originalState.text
    element.className = originalState.className
    element.style.width = originalState.styleWidth
  }

  // smooth scroll to element
  const scrollToElement = (element, options = {}) => {
    if (!isValidElement(element)) return false

    const defaultOptions = {
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    }

    element.scrollIntoView({ ...defaultOptions, ...options })
    return true
  }

  // show temporary feedback on element with cancellation support
  const showTemporaryFeedback = (element, message, duration = 1000) => {
    if (!isValidElement(element)) return false

    const originalState = {
      text: element.textContent,
      className: element.className,
      width: element.offsetWidth,
      styleWidth: element.style.width,
    }

    // apply feedback styling
    element.textContent = message
    element.className = 'copy-btn text-green-400 font-medium text-sm min-w-[3rem]'
    element.style.width = `${originalState.width}px`

    const timeoutId = setTimeout(() => {
      restoreElementState(element, originalState)
    }, duration)

    // return object w/ timeout ID and revert callback
    return {
      timeoutId,
      revert: () => {
        clearTimeout(timeoutId)
        restoreElementState(element, originalState)
      }
    }
  }

  // show toast notification
  // TODO: default duration constant
  const showToast = (message, duration = 3000) => {
    const toast = createElement('div', {
      className: 'fixed top-4 left-64 bg-blue-900 border border-blue-700 text-white-200 px-4 py-2 rounded-lg shadow-lg text-sm opacity-0 transform -translate-y-2 transition-all duration-300 ease-out z-50 min-w-48',
    }, message)

    document.body.appendChild(toast);

    // fade in
    setTimeout(() => {
      toast.style.opacity = '1'
      toast.style.transform = 'translateY(0)'
    }, 10) // TODO: fade in constant

    // fade out and remove
    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transform = 'translateY(-10px)'
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast)
        }
      }, 300) // TODO: (toast) fade out constant
    }, duration)
  }

  // toggle element visibility with animation
  const toggleVisibility = (element, force = null) => {
    if (!isValidElement(element)) return false

    const isHidden = element.classList.contains('hidden')
    const shouldShow = force !== null ? force : isHidden

    if (shouldShow) {
      element.classList.remove('hidden')
      element.style.display = 'block'
    } else {
      element.classList.add('hidden')
      element.style.display = 'none'
    }

    return shouldShow
  }

  // public API
  return {
    addEventListeners,
    addEventListenerWithCleanup,
    copyToClipboard,
    createElement,
    findElements,
    isValidElement,
    scrollToElement,
    showToast,
    showTemporaryFeedback,
    toggleVisibility,
  }
}

// text processing utilities factory
const createTextUtils = () => {
  // count sentences in text
  const countSentences = (text) => {
    if (!isValidText(text)) return 0
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  }

  // count words in text
  const countWords = (text) => {
    if (!isValidText(text)) return 0
    return normalizeWhitespace(text).split(' ').length
  }

  // escape HTML for safe display
  const escapeHtml = (text) => {
    if (!isValidText(text)) return ''

    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // smart text splitting with various strategies
  const findOptimalSplitPoint = (text, maxLength) => {
    if (text.length <= maxLength) return text.length

    let splitPoint = maxLength

    // strategy 1: sentence boundaries (highest priority)
    const sentenceEnd = text.lastIndexOf('.', maxLength)
    const questionEnd = text.lastIndexOf('?', maxLength)
    const exclamEnd = text.lastIndexOf('!', maxLength)
    const sentenceBoundary = Math.max(sentenceEnd, questionEnd, exclamEnd)

    if (sentenceBoundary > maxLength * 0.6) {
      return sentenceBoundary + 1
    }

    // strategy 2: paragraph breaks
    // for edge cases where code or bullets don't terminate in a period
    const paragraphBreak = text.lastIndexOf('\n\n', maxLength)
    if (paragraphBreak > maxLength * 0.5) {
      return paragraphBreak + 2
    }

    // strategy 3: line breaks
    const lineBreak = text.lastIndexOf('\n', maxLength)
    if (lineBreak > maxLength * 0.6) {
      return lineBreak + 1
    }

    // strategy 4: word boundaries (fallback)
    const lastSpace = text.lastIndexOf(' ', maxLength)
    if (lastSpace > maxLength * 0.6) {
      return lastSpace
    }

    // last resort: hard cut at maxLength
    return maxLength
  }

  // convert newlines to br tags
  const formatTextForDisplay = (text) => {
    if (!isValidText(text)) return ''
    return escapeHtml(text).replace(/\n/g, '<br>')
  }

  // generate text statistics
  const getTextStats = (text) => {
    return {
      characters: text.length,
      words: countWords(text),
      sentences: countSentences(text),
      lines: text.split('\n').length
    }
  }

  // private helper for validating text input
  const isValidText = (text) => {
    return typeof text === 'string' && text.length > 0
  }

  // private helper for normalizing whitespace
  const normalizeWhitespace = (text) => {
    return text.replace(/\s+/g, ' ').trim()
  }

  // parse manual separators (---)
  const parseManualSeparators = (text) => {
    if (!isValidText(text)) return [text || '']

    const lines = text.split('\n')
    const sections = []
    let currentSection = []

    for (const line of lines) {
      if (line.trim() === '---') {
        if (currentSection.length > 0) {
          sections.push(currentSection.join('\n'))
          currentSection = []
        }
      } else {
        currentSection.push(line)
      }
    }

    if (currentSection.length > 0) {
      sections.push(currentSection.join('\n'))
    }

    return sections.length > 0 ? sections : [text]
  }

  // truncate text with ellipsis
  const truncateText = (text, maxLength, ellipsis = '...') => {
    if (!isValidText(text) || text.length <= maxLength) return text

    const truncated = text.substring(0, maxLength - ellipsis.length)
    const lastSpace = truncated.lastIndexOf(' ')

    // try to break at word boundary
    if (lastSpace > maxLength * 0.7) {
      return truncated.substring(0, lastSpace) + ellipsis
    }

    return truncated + ellipsis
  }

  // public API
  return {
    countSentences,
    countWords,
    escapeHtml,
    findOptimalSplitPoint,
    formatTextForDisplay,
    getTextStats,
    parseManualSeparators,
    truncateText,
    // utility methods
    isValidText,
    normalizeWhitespace,
  }
}

// initialize utilities when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // create utility instances
  window.animationUtils = createAnimationUtils()
  window.domUtils = createDOMUtils()
  window.textUtils = createTextUtils()
})
