// /react/src/components/CharacterCounter.tsx

import { useEffect, useRef, useState } from 'react'
import { animationUtils } from '@/utils/animation-utils'
import { MAX_TWEET_LENGTH } from '@/utils/constants'

interface CharacterCounterProps {
  totalChars: number
  tweetCount: number
}

export const CharacterCounter = ({ totalChars, tweetCount }: CharacterCounterProps): JSX.Element => {
  const [numberValue, setNumberValue] = useState<number>(0)
  const [textPart, setTextPart] = useState<string>('characters')
  const [displayClass, setDisplayClass] = useState<string>('')

  const counterRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  const previousNumberRef = useRef<number>(0)
  const previousTextRef = useRef<string>('')
  const previousClassRef = useRef<string>('')

  useEffect(() => {
    let newNumber: number
    let newText: string
    let newClass: string

    if (totalChars === 0) {
      newNumber = 0
      newText = 'characters'
      newClass = 'text-sm font-medium text-gray-400'
    } else if (tweetCount === 1 && totalChars <= MAX_TWEET_LENGTH) {
      const remaining = MAX_TWEET_LENGTH - totalChars
      newNumber = remaining
      newText = remaining === 1 ? 'character remaining' : 'characters remaining'
      newClass = remaining > 20
        ? 'text-sm font-medium text-green-400'
        : 'text-sm font-medium text-yellow-400'
    } else {
      // for multi-tweet case, combine both numbers into text for now
      newNumber = totalChars
      newText = `characters → ${tweetCount} tweets`
      newClass = 'text-sm font-medium text-blue-400'
    }

    // update number (no animation, just direct update)
    if (previousNumberRef.current !== newNumber) {
      setNumberValue(newNumber)
      previousNumberRef.current = newNumber
    }

    // update text part
    if (previousTextRef.current !== newText) {
      setTextPart(newText)
      previousTextRef.current = newText
    }

    // update class (animate if changed)
    if (previousClassRef.current !== newClass) {
      if (counterRef.current) {
        animationUtils.fadeElement(textRef.current,'out', 100).then(() => {
          setDisplayClass(newClass)
          if (textRef.current) {
            animationUtils.fadeElement(textRef.current, 'in', 100)
          }
        })
      } else {
        setDisplayClass(newClass)
      }
      previousClassRef.current = newClass
    }

  }, [totalChars, tweetCount])

  return (
    <div id="charCounter" ref={counterRef} className={`${displayClass} whitespace-nowrap`}>
      <span ref={textRef}>{numberValue}&nbsp;{textPart}</span>
    </div>
  )
}
