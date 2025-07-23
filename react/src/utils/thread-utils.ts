// /react/src/utils/thread-utils.ts

import { Tweet } from '@/types'
import { textUtils } from './text-utils'
import { MAX_TWEET_LENGTH } from './constants'

export const createThreadUtils = () => {
  const createInitialTweets = (baseParts: string[]): Tweet[] => {
    return baseParts.map((part, idx) => ({
      baseText: part,
      id: Date.now() + idx,
      copied: false,
      omitIndicator: false,
      text: part,
    }))
  }

  const generateDisplayTweets = (baseTweets: Tweet[], includeIndicators: boolean): Tweet[] => {
    if (!includeIndicators) {
      return baseTweets.map(tweet => ({
        ...tweet,
        text: tweet.baseText
      }))
    }

    const displayTweets = baseTweets.map(tweet => ({ ...tweet }))

    let i = 0
    while (i < displayTweets.length) {
      const total = displayTweets.length
      const indicator = getIndicator(i, total)
      const fullLen = displayTweets[i].baseText.length + indicator.length

      if (fullLen > MAX_TWEET_LENGTH) {
        if (i === total - 1) {
          displayTweets[i].omitIndicator = true
          i++
        } else {
          const indicatorLen = indicator.length
          const splitPoint = textUtils.findOptimalSplitPoint(
            displayTweets[i].baseText,
            MAX_TWEET_LENGTH - indicatorLen
          )

          if (splitPoint > 0) {
            const part1 = displayTweets[i].baseText.substring(0, splitPoint).trim()
            const part2 = displayTweets[i].baseText.substring(splitPoint).trim()

            displayTweets[i].baseText = part1

            const newTweet: Tweet = {
              baseText: part2,
              id: Date.now() + Math.random(),
              copied: false,
              omitIndicator: false,
              text: part2,
            }

            displayTweets.splice(i + 1, 0, newTweet)
          } else {
            displayTweets[i].omitIndicator = true
            i++
          }
        }
      } else {
        i++
      }
    }

    const finalTotal = displayTweets.length
    displayTweets.forEach((tweet, index) => {
      const indicator = getIndicator(index, finalTotal, tweet.omitIndicator)
      tweet.text = tweet.baseText + indicator
    })

    return displayTweets
  }

  const getIndicator = (index: number, total: number, omit: boolean = false): string => {
    if (omit) return ''
    if (index === 0) return '\n\n🧵'
    if (index === total - 1) return '\n\n/End'
    return `\n\n${index + 1}/${total}`
  }

  const getNextUncopiedIndex = (tweets: Tweet[]): number => {
    return tweets.findIndex(tweet => !tweet.copied)
  }

  const splitIntoParts = (text: string): string[] => {
    const parts: string[] = []
    const manualSections = textUtils.parseManualSeparators(text)

    manualSections.forEach((section) => {
      section = section.trim()
      if (section) {
        let remaining = section
        while (remaining.length > MAX_TWEET_LENGTH) {
          const splitPoint = textUtils.findOptimalSplitPoint(remaining, MAX_TWEET_LENGTH)
          parts.push(remaining.substring(0, splitPoint).trim())
          remaining = remaining.substring(splitPoint).trim()
        }
        if (remaining.length > 0) {
          parts.push(remaining)
        }
      }
    })

    return parts
  }

  return {
    createInitialTweets,
    generateDisplayTweets,
    getIndicator,
    getNextUncopiedIndex,
    splitIntoParts,
  }
}

export const threadUtils = createThreadUtils()
