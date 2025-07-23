// /react/src/components/CharacterCounter.tsx

import { useEffect, useRef, useState } from 'react'
import { animationUtils } from '@/utils/animation-utils'
import { MAX_TWEET_LENGTH } from '@/utils/constants'

interface CharacterCounterProps {
  totalChars: number
  tweetCount: number
}

export const CharacterCounter = ({ totalChars, tweetCount }: CharacterCounterProps): JSX.Element => {
  const [displayText, setDisplayText] = useState<string>('')
  const [displayClass, setDisplayClass] = useState<string>('')
  const counterRef = useRef<HTMLDivElement>(null)
  const previousTextRef = useRef<string>('')

  useEffect(() => {
    let newText: string
    let newClass: string

    if (totalChars === 0) {
      newText = '0 characters'
      newClass = 'text-sm font-medium text-gray-400'
    } else if (tweetCount === 1 && totalChars <= MAX_TWEET_LENGTH) {
      const remaining = MAX_TWEET_LENGTH - totalChars
      newText = `${remaining} characters remaining`
      newClass = remaining > 20
        ? 'text-sm font-medium text-green-400'
        : 'text-sm font-medium text-yellow-400'
    } else {
      newText = `${totalChars} characters → ${tweetCount} tweets`
      newClass = 'text-sm font-medium text-blue-400'
    }

    // Animate counter change if text actually changed
    if (previousTextRef.current !== newText) {
      if (counterRef.current) {
        animationUtils.fadeElement(counterRef.current, 'out', 100).then(() => {
          setDisplayText(newText)
          setDisplayClass(newClass)
          if (counterRef.current) {
            animationUtils.fadeElement(counterRef.current, 'in', 100)
          }
        })
      } else {
        setDisplayText(newText)
        setDisplayClass(newClass)
      }
      previousTextRef.current = newText
    }
  }, [totalChars, tweetCount])

  return (
    <div
      ref={counterRef}
      id="charCounter"
      className={displayClass}
    >
      {displayText}
    </div>
  )
}
