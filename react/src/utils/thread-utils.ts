// /react/src/utils/thread-utils.ts

import { Tweet } from '@/types'
import { textUtils } from './text-utils'
import { MAX_TWEET_LENGTH } from './constants'

export const createThreadUtils = () => {
  // create initial tweet objects from parts
  const createInitialTweets = (baseParts: string[]): Tweet[] => {
    return baseParts.map((part, idx) => ({
      baseText: part,
      id: Date.now() + idx,
      copied: false,
      omitIndicator: false,
      text: part,
    }))
  }

  // generate display tweets from base tweets (clean rebuild every time)
  const generateDisplayTweets = (baseTweets: Tweet[], includeIndicators: boolean): Tweet[] => {
    if (!includeIndicators) {
      // no indicators needed, just copy base tweets and set text
      return baseTweets.map(tweet => ({
        ...tweet,
        text: tweet.baseText
      }))
    }

    // apply indicators and split as needed
    const displayTweets = baseTweets.map(tweet => ({ ...tweet }))

    let changed
    do {
      changed = false
      const total = displayTweets.length
      for (let i = 0; i < total; ++i) {
        const indicator = getIndicator(i, total)
        const fullLen = displayTweets[i].baseText.length + indicator.length

        if (fullLen > MAX_TWEET_LENGTH) {
          // need to split this tweet
          if (i === total - 1) {
            // last tweet, omit indicator instead of splitting
            displayTweets[i].omitIndicator = true
          } else {
            const indicatorLen = indicator.length
            const splitPoint = textUtils.findOptimalSplitPoint(
              displayTweets[i].baseText,
              MAX_TWEET_LENGTH - indicatorLen
            )

            if (splitPoint > 0 && splitPoint < displayTweets[i].baseText.length) {
              const part1 = displayTweets[i].baseText.substring(0, splitPoint).trim()
              const part2 = displayTweets[i].baseText.substring(splitPoint).trim()

              // only split if part2 is non-empty and substantial (i.e., > 5 chars)
              if (part2.length > 5) {
                displayTweets[i].baseText = part1

                const newTweet = {
                  baseText: part2,
                  id: Date.now() + Math.random(), // ensure unique ID
                  copied: false,
                  omitIndicator: false,
                  text: part2,
                }

                displayTweets.splice(i + 1, 0, newTweet)
                changed = true
                break // restart loop to recalculate indicators with new total
              } else {
                // part2 too short; omit indicator
                displayTweets[i].omitIndicator = true
              }
            } else {
              // can't split meaningfully; omit indicator
              displayTweets[i].omitIndicator = true
            }
          }
        }
      }
    } while (changed)

    // now set final text with indicators
    const finalTotal = displayTweets.length
    displayTweets.forEach((tweet, index) => {
      const indicator = getIndicator(index, finalTotal, tweet.omitIndicator)

      tweet.text = tweet.baseText + indicator
    })

    return displayTweets
  }

  // compute thread indicator for tweet position
  const getIndicator = (index: number, total: number, omit: boolean = false): string => {
    if (omit) return ''
    if (index === 0) return '\n\n🧵'
    if (index === total - 1) return '\n\n/End'
    return `\n\n${index + 1}/${total}`
  }

  const getNextUncopiedIndex = (tweets: Tweet[]): number => {
    return tweets.findIndex(tweet => !tweet.copied)
  }

  // split text into tweet parts (strings only, no objects)
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
