// /react/src/App.tsx

import React, { useCallback, useRef, useState } from 'react'
import { Tweet } from '@/types'
import { useDebounce } from '@/hooks/use-debounce'
import { useThreadSplitter } from '@/hooks/use-thread-splitter'
import { useUrlState } from '@/hooks/use-url-state'
import { ThreadPreview } from '@/components/ThreadPreview'
import { CharacterCounter } from '@/components/CharacterCounter'
import { DEBOUNCE_DELAY, MANUAL_SEPARATOR } from '@/utils/constants'
import '@/styles/main.scss'

export const App = (): JSX.Element => {
  const [text, setText] = useState<string>('')
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [cursorPosition, setCursorPosition] = useState<number>(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { getHashParam, setHashParam } = useUrlState()
  const [includeThreadIndicators, setIncludeThreadIndicators] = useState<boolean>(
    () => getHashParam('ind', false)
  )
  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(
    () => getHashParam('ani', false)
  )

  const debouncedText = useDebounce(text, DEBOUNCE_DELAY)
  const processedTweets = useThreadSplitter(debouncedText, includeThreadIndicators)

  // update tweets when processed tweets change
  React.useEffect(() => {
    setTweets(processedTweets)
  }, [processedTweets])

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setText(e.target.value)
    setCursorPosition(e.target.selectionStart)
  }, [])

  // const handleTextareaClick = useCallback((e: React.MouseEventHandler<HTMLTextAreaElement>): void => {
  //   setCursorPosition(e.)
  // }, [])

  const handleTextareaKeyUp = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    setCursorPosition(e.currentTarget.selectionStart)
  }, [])

  // const handleTextareaSelect = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
  //   setCursorPosition(e.target.selectionStart)
  // }, [])

  const handleThreadIndicatorsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const checked = e.target.checked
    setIncludeThreadIndicators(checked)
    setHashParam('ind', checked)
  }, [setHashParam])

  const handleAnimationsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const checked = e.target.checked
    setAnimationsEnabled(checked)
    setHashParam('ani', checked)
  }, [setHashParam])

  const handleTweetCopy = useCallback((tweetId: number): void => {
    setTweets(prevTweets =>
      prevTweets.map(tweet =>
        tweet.id === tweetId ? { ...tweet, copied: true } : tweet
      )
    )
  }, [])

  const handleCopyNext = useCallback((): void => {
    // Additional logic for copy next feedback could go here
  }, [])

  const handleResetCopy = useCallback((): void => {
    setTweets(prevTweets =>
      prevTweets.map(tweet => ({ ...tweet, copied: false }))
    )
  }, [])

  const handleAutoSplit = useCallback((): void => {
    if (text.trim()) {
      // Force re-processing by updating the text state
      setText(prev => prev + '')
    } else {
      setTweets([])
    }
  }, [text])

  const handleClearAll = useCallback((): void => {
    setText('')
    setTweets([])
  }, [])

  const handleInsertSeparator = useCallback((): void => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const cursorPos = textarea.selectionStart
    const textBefore = text.substring(0, cursorPos)
    const textAfter = text.substring(cursorPos)

    const separator = textBefore.endsWith('\n') ? `${MANUAL_SEPARATOR}\n` : `\n${MANUAL_SEPARATOR}\n`
    const newText = textBefore + separator + textAfter

    setText(newText)
    textarea.focus()

    // Set cursor position after separator
    setTimeout(() => {
      const newCursorPos = cursorPos + separator.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [text])

  return (
    <div className="bg-gray-900 font-twitter h-screen overflow-hidden text-white">
      <div className="h-full flex">
        {/* Left side - composer */}
        <div className="w-1/2 p-6 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6">Thread Composer</h1>

            {/* Main text area */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Compose your thread
              </label>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                // onClick={handleTextareaClick}
                onKeyUp={handleTextareaKeyUp}
                // onSelect={handleTextareaSelect}
                className="w-full h-64 p-4 bg-gray-700 border border-gray-600 text-white rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base leading-relaxed placeholder-gray-400 min-h-32"
                placeholder="Start writing your thread here... When you go over 280 characters, it'll automatically split into multiple tweets."
              />
            </div>

            {/* Character counter */}
            <div className="mb-4 flex justify-between items-center">
              <CharacterCounter
                totalChars={text.length}
                tweetCount={tweets.length}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAutoSplit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Auto Split
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Options and manual split controls */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Options and Manual Controls</h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleInsertSeparator}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                >
                  Insert ---
                </button>
              </div>

              {/* Thread indicators checkbox */}
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  id="threadIndicators"
                  checked={includeThreadIndicators}
                  onChange={handleThreadIndicatorsChange}
                  className="rounded text-blue-500"
                />
                <label htmlFor="threadIndicators">Include thread indicators</label>
              </div>

              {/* Animation toggle (hidden for now, like original) */}
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-400 hidden">
                <input
                  type="checkbox"
                  id="animationToggle"
                  checked={animationsEnabled}
                  onChange={handleAnimationsChange}
                  className="rounded text-blue-500"
                />
                <label htmlFor="animationToggle">Enable animations</label>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
              <h4 className="font-medium text-blue-200 mb-2">💡 Tips</h4>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• Type <code className="bg-blue-800 px-1 rounded">---</code> on its own line to manually split tweets</li>
                <li>• Auto Split intelligently breaks at sentence boundaries first</li>
                <li>• Use Insert --- button to add separators at cursor position</li>
                <li>• Edit individual tweets directly in the preview</li>
                <li>• Click copy button to grab individual tweets</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right side - thread preview */}
        <div className="w-1/2 p-6 bg-gray-900">
          <ThreadPreview
            tweets={tweets}
            text={text}
            cursorPosition={cursorPosition}
            onTweetCopy={handleTweetCopy}
            onCopyNext={handleCopyNext}
            onResetCopy={handleResetCopy}
          />
        </div>
      </div>
    </div>
  )
}
