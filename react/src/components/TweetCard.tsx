// /react/src/components/TweetCard.tsx

import { useRef } from 'react'
import { Tweet } from '@/types'
import { domUtils } from '@/utils/dom-utils'
import { textUtils } from '@/utils/text-utils'
import { MAX_TWEET_LENGTH } from '@/utils/constants'
import './TweetCard.scss'

interface TweetCardProps {
  tweet: Tweet
  index: number
  totalCount: number
  onCopy: (tweetId: number) => void
}

export const TweetCard = ({ tweet, index, totalCount, onCopy }: TweetCardProps): JSX.Element => {
  const copyButtonRef = useRef<HTMLButtonElement>(null)
  const charCount = tweet.text.length
  const isOverLimit = charCount > MAX_TWEET_LENGTH
  const remaining = MAX_TWEET_LENGTH - charCount

  const handleCopy = async (): Promise<void> => {
    const success = await domUtils.copyToClipboard(tweet.text)

    if (success) {
      onCopy(tweet.id)

      const feedback = domUtils.showTemporaryFeedback(
        copyButtonRef.current,
        'Copied!',
        1000
      )

      if (feedback && copyButtonRef.current) {
        copyButtonRef.current.style.transform = 'scale(1.1)'
        copyButtonRef.current.style.transition = 'all 0.15s ease-out'

        setTimeout(() => {
          if (copyButtonRef.current) {
            copyButtonRef.current.style.transform = 'scale(1)'
          }
        }, 100)
      }
    }
  }

  return (
    <div
      className={`tweet-card bg-gray-800 rounded-xl border border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow ${
        tweet.copied ? 'tweet-copied' : ''
      }`}
      data-tweet-id={tweet.id}
      data-index={index}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {index + 1}
          </div>
          <span className="text-sm text-gray-400">
            Tweet {index + 1}/{totalCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono ${
              isOverLimit
                ? 'text-red-400 font-bold'
                : remaining < 20
                ? 'text-yellow-400'
                : 'text-gray-400'
            }`}
          >
            {isOverLimit ? `+${Math.abs(remaining)}` : remaining}
          </span>
          <button
            ref={copyButtonRef}
            onClick={handleCopy}
            className="copy-btn text-blue-400 hover:text-blue-300 text-sm font-medium min-w-[3rem]"
          >
            Copy
          </button>
        </div>
      </div>

      <div className={`tweet-content ${isOverLimit ? 'border-red-600 bg-red-900/20' : ''}`}>
        <div
          className="tweet-display p-3 bg-gray-700 rounded-lg text-white text-base leading-relaxed break-words"
          dangerouslySetInnerHTML={{ __html: textUtils.formatTextForDisplay(tweet.text) }}
        />
      </div>

      {isOverLimit && (
        <div className="mt-2 text-sm text-red-400 font-medium">
          ⚠️ Over limit by {Math.abs(remaining)} characters
        </div>
      )}
    </div>
  )
}
