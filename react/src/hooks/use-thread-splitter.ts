// /react/src/hooks/use-thread-splitter.ts

import { useMemo } from 'react'
import { Tweet } from '@/types'
import { threadUtils } from '@/utils/thread-utils'

export const useThreadSplitter = (
  text: string,
  includeThreadIndicators: boolean
): Tweet[] => {
  return useMemo(() => {
    if (!text.trim()) return []

    const baseParts = threadUtils.splitIntoParts(text)
    const baseTweets = threadUtils.createInitialTweets(baseParts)
    return threadUtils.generateDisplayTweets(baseTweets, includeThreadIndicators)
  }, [text, includeThreadIndicators])
}
