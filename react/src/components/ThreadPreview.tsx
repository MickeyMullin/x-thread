// /react/src/components/ThreadPreview.tsx

import { useEffect, useRef } from 'react'
import { Tweet } from '@/types'
import { TweetCard } from './TweetCard'
import { domUtils } from '@/utils/dom-utils'
import { threadUtils } from '@/utils/thread-utils'

interface ThreadPreviewProps {
  tweets: Tweet[]
  text: string
  cursorPosition: number
  onTweetCopy: (tweetId: number) => void
  onCopyNext: () => void
  onResetCopy: () => void
}

type TweetPositions = number
  | 'last' | 'end' | 'bottom'
  | 'first' | 'start' | 'top'

export const ThreadPreview = ({
  tweets,
  text,
  cursorPosition,
  onTweetCopy,
  onCopyNext,
  onResetCopy
}: ThreadPreviewProps): JSX.Element => {
  const previewRef = useRef<HTMLDivElement>(null)
  const nextUncopiedIndex = threadUtils.getNextUncopiedIndex(tweets)
  const hasUncopiedTweets = nextUncopiedIndex !== -1
  const allCopied = tweets.length > 0 && !hasUncopiedTweets

  const scrollToTweet = (tweetIndex: TweetPositions): void => {
    if (tweets.length === 0) return

    let idx: number
    if (tweetIndex === 'last' || tweetIndex === 'end' || tweetIndex === 'bottom') {
      idx = tweets.length - 1
    } else if (tweetIndex === 'first' || tweetIndex === 'start' || tweetIndex === 'top') {
      idx = 0
    } else {
      idx = tweetIndex as number
    }

    const tweet = tweets[idx]
    if (previewRef.current) {
      const card = previewRef.current.querySelector(`[data-tweet-id="${tweet.id}"]`)
      if (card) {
        domUtils.scrollToElement(card, { behavior: 'smooth', block: 'start' })
      }
    }
  }

  const handleCopyNext = async (): Promise<void> => {
    if (nextUncopiedIndex === -1) return

    const tweet = tweets[nextUncopiedIndex]
    const success = await domUtils.copyToClipboard(tweet.text)

    if (success) {
      onTweetCopy(tweet.id)
      scrollToTweet(nextUncopiedIndex)
      onCopyNext()
    }
  }

  const handleResetCopy = (): void => {
    onResetCopy()
    scrollToTweet(0)
  }

  const previousTweetsRef = useRef<Tweet[]>([])
  const previousTextRef = useRef<string>('')

  useEffect(() => {
    // auto-scroll to last tweet when typing at end of text
    if (tweets.length > 0 && text !== previousTextRef.current) {
      const textLength = text.length
      const isAtEnd = cursorPosition >= textLength - 10

      if (isAtEnd) {
        scrollToTweet('last')
      }
    }

    previousTweetsRef.current = tweets
    previousTextRef.current = text
  }, [tweets, text, cursorPosition])

  if (tweets.length === 0) {
    return (
      <div className="max-w-2xl mx-auto h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Thread Preview</h2>
          <div className="flex items-center gap-2">
            <button
              disabled
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md font-medium text-sm opacity-50 cursor-not-allowed"
            >
              Copy Next
            </button>
            <button
              disabled
              className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded-md font-medium text-sm opacity-50 cursor-not-allowed"
            >
              Reset Copy
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-4">🧵</div>
            <p className="text-lg">Start typing to see your thread preview</p>
            <p className="text-sm mt-2">
              Use <code className="bg-gray-700 px-1 rounded">---</code> to manually split tweets
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Thread Preview</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyNext}
            disabled={!hasUncopiedTweets}
            className={`bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md font-medium text-sm ${
              !hasUncopiedTweets ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {allCopied ? 'Tweets Copied' : `Copy ${nextUncopiedIndex + 1}/${tweets.length}`}
          </button>
          <button
            onClick={handleResetCopy}
            className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded-md font-medium text-sm"
          >
            Reset Copy
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div
          ref={previewRef}
          className="space-y-4 max-h-full overflow-y-auto pr-2"
        >
          {tweets.map((tweet, index) => (
            <TweetCard
              key={tweet.id}
              tweet={tweet}
              index={index}
              totalCount={tweets.length}
              onCopy={onTweetCopy}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
