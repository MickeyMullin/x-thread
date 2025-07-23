// /react/src/utils/text-utils.ts

import { TextStats } from '@/types'
import { MANUAL_SEPARATOR } from './constants'

export const createTextUtils = () => {
  const countSentences = (text: string): number => {
    if (!isValidText(text)) return 0
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  }

  const countWords = (text: string): number => {
    if (!isValidText(text)) return 0
    return normalizeWhitespace(text).split(' ').length
  }

  const escapeHtml = (text: string): string => {
    if (!isValidText(text)) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const findOptimalSplitPoint = (text: string, maxLength: number): number => {
    if (text.length <= maxLength) return text.length

    // strategy 1: sentence boundaries (highest priority)
    const sentenceEnd = text.lastIndexOf('.', maxLength)
    const questionEnd = text.lastIndexOf('?', maxLength)
    const exclamEnd = text.lastIndexOf('!', maxLength)
    const sentenceBoundary = Math.max(sentenceEnd, questionEnd, exclamEnd)

    if (sentenceBoundary > maxLength * 0.6) {
      return sentenceBoundary + 1
    }

    // strategy 2: paragraph breaks
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

  const formatTextForDisplay = (text: string): string => {
    if (!isValidText(text)) return ''
    return escapeHtml(text).replace(/\n/g, '<br>')
  }

  const getTextStats = (text: string): TextStats => {
    return {
      characters: text.length,
      words: countWords(text),
      sentences: countSentences(text),
      lines: text.split('\n').length
    }
  }

  const isValidText = (text: string): boolean => {
    return typeof text === 'string' && text.length > 0
  }

  const normalizeWhitespace = (text: string): string => {
    return text.replace(/\s+/g, ' ').trim()
  }

  const parseManualSeparators = (text: string): string[] => {
    if (!isValidText(text)) return [text || '']

    const lines = text.split('\n')
    const sections: string[] = []
    let currentSection: string[] = []

    for (const line of lines) {
      if (line.trim() === MANUAL_SEPARATOR) {
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

  const truncateText = (text: string, maxLength: number, ellipsis: string = '...'): string => {
    if (!isValidText(text) || text.length <= maxLength) return text

    const truncated = text.substring(0, maxLength - ellipsis.length)
    const lastSpace = truncated.lastIndexOf(' ')

    // try to break at word boundary
    if (lastSpace > maxLength * 0.7) {
      return truncated.substring(0, lastSpace) + ellipsis
    }

    return truncated + ellipsis
  }

  return {
    countSentences,
    countWords,
    escapeHtml,
    findOptimalSplitPoint,
    formatTextForDisplay,
    getTextStats,
    isValidText,
    normalizeWhitespace,
    parseManualSeparators,
    truncateText,
  }
}

export const textUtils = createTextUtils()
