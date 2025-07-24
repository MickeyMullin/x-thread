// /react/src/App.tsx

import React, { useCallback, useRef, useState } from 'react'
import { Tweet } from '@/types'
import { useDebounce } from '@/hooks/use-debounce'
import { useDraft } from '@/hooks/use-draft'
import { useThreadSplitter } from '@/hooks/use-thread-splitter'
import { useUrlState } from '@/hooks/use-url-state'
import { toastUtils } from '@/utils/toast-utils'
import { CharacterCounter } from '@/components/CharacterCounter'
import { DraftStatus } from '@/components/DraftStatus'
import { ThreadPreview } from '@/components/ThreadPreview'
import { DEBOUNCE_DELAY, MANUAL_SEPARATOR } from '@/utils/constants'
import '@/styles/main.scss'

export const App = (): JSX.Element => {
  const [text, setText] = useState<string>('')
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [cursorPosition, setCursorPosition] = useState<number>(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { draftState, autoSaveDraft, clearDraft, loadDraft, saveDraft } = useDraft()
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

  // load draft on app initialization
  React.useEffect(() => {
    const draftText = loadDraft()
    if (draftText && draftText.trim()) {
      setText(draftText)
      toastUtils.showToast('Draft restored')
    }
  }, [loadDraft])

  // beforeunload backup save
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      if (text.trim()) {
        saveDraft(text)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [text, saveDraft])

  const handleClearDraft = useCallback((): void => {
    const success = clearDraft()
    if (success) {
      toastUtils.showToast('Draft cleared')
    }
  }, [clearDraft])

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const newText = e.target.value
    setText(newText)
    setCursorPosition(e.target.selectionStart)

    // auto-save draft
    autoSaveDraft(newText)
  }, [autoSaveDraft])

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
    // additional logic for copy next feedback could go here
  }, [])

  const handleResetCopy = useCallback((): void => {
    setTweets(prevTweets =>
      prevTweets.map(tweet => ({ ...tweet, copied: false }))
    )
  }, [])

  const handleAutoSplit = useCallback((): void => {
    if (text.trim()) {
      // force re-processing by updating the text state
      setText(prev => prev + '')
    } else {
      setTweets([])
    }
  }, [text])

  const handleClearEditor = useCallback((): void => {
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

    // set cursor position after separator
    setTimeout(() => {
      const newCursorPos = cursorPos + separator.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [text])

  return (
    <div className="bg-gray-900 font-twitter h-screen overflow-hidden text-white">
      <div className="h-full flex">
        {/* left side - composer */}
        <div className="w-1/2 p-6 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6">Thread Composer</h1>

            {/* main text area */}
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

            {/* character counter */}
            <div className="mb-4 flex justify-between items-start">
              <div className="flex flex-col">
                <CharacterCounter
                  totalChars={text.length}
                  tweetCount={tweets.length}
                />
                <DraftStatus hasDraft={draftState.hasDraft} lastSaved={draftState.lastSaved} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAutoSplit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Auto Split
                </button>
                <button
                  onClick={handleClearEditor}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Clear Editor
                </button>
              </div>
            </div>

            {/* options and manual split controls */}
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

              {/* thread indicators checkbox */}
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

              {/* animation toggle (hidden for now) */}
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

            {/* tips */}
            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
              <h4 className="font-medium text-blue-200 mb-2">💡 Tips</h4>
              <ul className="text-sm text-blue-300 space-y-1 list-disc list-inside">
                <li>Type <code className="bg-blue-800 px-1 rounded">---</code> on its own line to manually split tweets</li>
                <li>Auto Split intelligently breaks at sentence boundaries first</li>
                <li>Use Insert --- button to add separators at cursor position</li>
                <li>Edit individual tweets directly in the preview</li>
                <li>Click copy button to grab individual tweets</li>
                <li>Your work auto-saves locally (browser only, ~5MB limit)</li>
                <li>Drafts persist between sessions until manually cleared</li>
              </ul>
            </div>

            {/* drafts */}
            <div className="mt-4 bg-gray-800 border border-gray-600 rounded-lg p-3">
              <h4 className="font-medium text-gray-300 mb-2 text-sm">💾 Drafts</h4>
              <button
                onClick={handleClearDraft}
                className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
              >
                Clear Draft
              </button>
            </div>
          </div>
        </div>

        {/* right side - thread preview */}
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
