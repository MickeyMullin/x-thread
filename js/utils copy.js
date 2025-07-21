// /js/utils.js

// text processing utilities
const TextUtils = {
  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  },

  parseManualSeparators(text) {
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
}

// DOM utilities
const DOMUtils = {
  copyToClipboard(text) {
    return navigator.clipboard.writeText(text)
  },

  showTemporaryFeedback(element, message, duration = 1000) {
    const originalText = element.textContent
    const originalClass = element.className

    element.textContent = message
    element.className = 'copy-btn text-green-400 font-medium text-sm'

    setTimeout(() => {
      element.textContent = originalText
      element.className = originalClass
    }, duration)
  }
}
