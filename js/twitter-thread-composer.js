// /js/twitter-thread-composer.js

const createTwitterThreadComposer = () => {
  let tweets = []
  const debounceDelay = 300
  const maxLength = 280

  // get utility references (after DOM ready)
  let animationUtils
  let domUtils
  let textUtils

  // DOM elements
  let mainText
  let charCounter
  let threadPreview
  let emptyState

  // buttons for copy features
  let copyNext
  let copyNextFeedbackTimeout = null
  let resetCopy

  let animationsEnabled = true
  let animationToggle

  let isInitialRender = true
  let lastRenderedTweets = []
  let previousTweetCount = 0

  // track thread indicators state
  let includeThreadIndicators = false
  let threadIndicators

  /*********************
   * private functions *
   *********************/

  // add hover animations to buttons
  const animateButton = (button) => {
    button.style.transition = 'all 0.2s ease-out'

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-1px)'
      button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
    })

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)'
      button.style.boxShadow = 'none'
    })

    button.addEventListener('mousedown', () => {
      button.style.transform = 'translateY(0) scale(0.98)'
    })

    button.addEventListener('mouseup', () => {
      button.style.transform = 'translateY(-1px) scale(1)'
    })
  }

  // check if tweets changed
  const checkTweetsChanged = () => {
    return tweets.length !== lastRenderedTweets.length
      || tweets.some((tweet, idx) =>
        !lastRenderedTweets[idx]
        || tweet.text !== lastRenderedTweets[idx].text
        || tweet.copied !== lastRenderedTweets[idx].copied
        || tweet.omitIndicator !== lastRenderedTweets[idx].omitIndicator
      )
  }

  // create initial tweet objects from parts
  const createInitialTweets = (baseParts) => {
    return baseParts.map((part, idx) => ({
      baseText: part,
      id: Date.now() + idx,
      copied: false,
      omitIndicator: false,
      // text: part || '', // shouldn't this be here?
    }))
  }

  // generate display tweets from base tweets (clean rebuild every time)
  const generateDisplayTweets = (baseTweets) => {
    if (!includeThreadIndicators) {
      // no indicators needed, just copy base tweets and set text
      return baseTweets.map(tweet => ({
        ...tweet,
        text: tweet.baseText
      }))
    }

    // apply indicators and split as needed
    const displayTweets = baseTweets.map(tweet => ({ ...tweet }))

    let i = 0
    while (i < displayTweets.length) {
      const total = displayTweets.length
      const indicator = getIndicator(i, total)
      const fullLen = displayTweets[i].baseText.length + indicator.length

      if (fullLen > maxLength) {
        // need to split this tweet
        if (i === total - 1) {
          // last tweet, omit indicator instead of splitting
          displayTweets[i].omitIndicator = true
          i++
        } else {
          const indicatorLen = indicator.length
          const splitPoint = textUtils.findOptimalSplitPoint(displayTweets[i].baseText, maxLength - indicatorLen)

          if (splitPoint > 0) {
            const part1 = displayTweets[i].baseText.substring(0, splitPoint).trim()
            const part2 = displayTweets[i].baseText.substring(splitPoint).trim()

            displayTweets[i].baseText = part1

            const newTweet = {
              baseText: part2,
              id: Date.now() + Math.random(), // ensure unique ID
              copied: false,
              omitIndicator: false
            }

            displayTweets.splice(i + 1, 0, newTweet)
            // don't increment i, recheck current tweet with new total
          } else {
            // can't split meaningfully, omit indicator
            displayTweets[i].omitIndicator = true
            i++
          }
        }
      } else {
        i++
      }
    }

    // now set final text with indicators
    const finalTotal = displayTweets.length
    displayTweets.forEach((tweet, index) => {
      const indicator = getIndicator(index, finalTotal, tweet.omitIndicator)
      tweet.text = tweet.baseText + indicator
    })

    return displayTweets
  }

  // handle empty state display
  const handleEmptyState = async () => {
    if (animationsEnabled) {
      await animationUtils.fadeElement(threadPreview, 'out', 200)
    }

    threadPreview.style.display = 'none'
    emptyState.style.display = 'block'

    if (animationsEnabled) {
      await animationUtils.fadeElement(emptyState, 'in', 200)
    }
  }

  // remove deleted tweet cards
  const removeDeletedCards = () => {
    const existingCards = threadPreview.querySelectorAll('[data-tweet-id]')
    const newIds = tweets.map(tweet => tweet.id)
    existingCards.forEach(card => {
      const id = parseInt(card.dataset.tweetId)
      if (!newIds.includes(id)) {
        card.remove()
      }
    })
  }

  const scrollToTweet = (tweetIndex) => {
    if (tweets.length === 0) return

    let idx
    if (tweetIndex === 'last' || tweetIndex === 'end' || tweetIndex === 'bottom') {
      idx = tweets.length - 1
    } else if (tweetIndex === 'first' || tweetIndex === 'start' || tweetIndex === 'top') {
      idx = 0
    } else {
      idx = tweetIndex
    }

    const tweet = tweets[idx]
    const card = threadPreview.querySelector(`[data-tweet-id="${tweet.id}"]`)

    if (card) {
      domUtils.scrollToElement(card, { behavior: 'smooth', block: 'start' })
    }
  }

  // setup button hover and click animations
  const setupButtonAnimations = () => {
    // apply to all main buttons
    const buttons = [
      document.getElementById('addTweet'),
      document.getElementById('autoSplit'),
      document.getElementById('clearAll'),
      document.getElementById('insertSeparator'),
      copyNext,
      resetCopy,
    ]
    buttons.forEach(button => {
      if (button) animateButton(button)
    })
  }

  // setup copy-related event listeners
  const setupCopyListeners = () => {
    copyNext.addEventListener('click', async () => {
      const nextIndex = getNextUncopiedIndex()
      if (nextIndex === -1) return

      const tweet = tweets[nextIndex]
      const success = await domUtils.copyToClipboard(tweet.text)

      if (success) {
        tweet.copied = true
        scrollToTweet(nextIndex)
        updateDisplay()
        copyNextFeedbackTimeout = domUtils.showTemporaryFeedback(copyNext, 'Copied!', 1000)
      }
    })

    resetCopy.addEventListener('click', () => {
      tweets.forEach(tweet => {
        tweet.copied = false
      })
      if (copyNextFeedbackTimeout) {
        clearTimeout(copyNextFeedbackTimeout)
        copyNextFeedbackTimeout = null
      }
      updateDisplay()
      domUtils.showTemporaryFeedback(resetCopy, 'Reset!', 1000)

      // scroll to top after reset
      scrollToTweet(0)
    })
  }

  // setup core event listeners (input, checkboxes, main buttons)
  const setupCoreListeners = () => {
    let debounceTimer

    mainText.addEventListener('input', () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(handleTextInput, debounceDelay)
    })

    animationToggle.addEventListener('change', (e) => {
      setAnimationsEnabled(e.target.checked)
    })

    document.getElementById('addTweet').addEventListener('click', addEmptyTweet)
    document.getElementById('autoSplit').addEventListener('click', autoSplit)
    document.getElementById('clearAll').addEventListener('click', clearAll)
    document.getElementById('insertSeparator').addEventListener('click', insertSeparator)

    threadIndicators.addEventListener('change', threadIndicatorsChangeHandler)
  }

  const threadIndicatorsChangeHandler = (e) => {
    includeThreadIndicators = e.target.checked
    setHashParam('ind', e.target.checked ? 'y' : 'n')

    // mark as non-initial render since this is a settings change
    isInitialRender = false

    // rebuild display tweets from current text
    if (mainText.value.trim()) {
      const baseParts = splitIntoParts(mainText.value)
      buildTweetsFromParts(baseParts)
    } else {
      tweets = []
      updateDisplay()
    }
  }

  // update or add tweet cards
  const updateOrAddCards = () => {
    tweets.forEach((tweet, idx) => {
      let card = threadPreview.querySelector(`[data-tweet-id="${tweet.id}"]`)

      if (!card) {
        // create new card
        const cardHTML = createTweetCard(tweet, idx)
        threadPreview.insertAdjacentHTML('beforeend', cardHTML)
        card = threadPreview.querySelector(`[data-tweet-id="${tweet.id}"]`)

        // attach event handlers to this new card
        setupTweetCardListeners(card)

        // only animate NEW cards if animations enabled AND not initial render
        if (animationsEnabled && !isInitialRender) {
          card.style.opacity = '0'
          card.style.transform = 'translateY(20px)'
          setTimeout(() => {
            card.style.opacity = '1'
            card.style.transform = 'translateY(0)'
            card.style.transition = 'transform 0.3s ease-out'
          }, idx * 50)
        }
      } else {
        // update existing card (copy state, content, etc.)
        if (tweet.copied) {
          card.classList.add('tweet-copied')
        } else {
          card.classList.remove('tweet-copied')
        }

        // update existing card content if changed
        const displayDiv = card.querySelector('.tweet-display')
        const newContent = textUtils.formatTextForDisplay(tweet.text)
        if (displayDiv.innerHTML !== newContent) {
          displayDiv.innerHTML = newContent
        }

        // update character count display
        const charSpan = card.querySelector('.text-xs.font-mono')
        const remaining = maxLength - tweet.text.length
        const isOverLimit = remaining < 0

        charSpan.textContent = isOverLimit ? `+${Math.abs(remaining)}` : remaining
        // TODO: move nested ternary to a char count class selector function
        charSpan.className = `text-xs font-mono ${isOverLimit ? 'text-red-400 font-bold' : remaining < 20 ? 'text-yellow-400' : 'text-gray-400'}`
      }
    })

    // initial render is complete
    isInitialRender = true
  }

  /********************
   * public functions *
   ********************/

  // add empty tweet
  const addEmptyTweet = () => {
    tweets.push({
      baseText: '',
      id: Date.now(),
      copied: false,
      omitIndicator: false,
      text: getIndicator(0, 0, !includeThreadIndicators),
    })
    updateDisplay()
  }

  const animateTweetCount = (fromCount, toCount) => {
    const duration = 400

    animationUtils.animateValue(fromCount, toCount, duration, (currentValue) => {
      const roundedValue = Math.round(currentValue)
      // update any tweet count displays with the animated value
      document.querySelectorAll('.tweet-counter').forEach(counter => {
        counter.textContent = roundedValue
      })
    }, 'easeOutCubic')
  }

  // auto-split current text
  const autoSplit = () => {
    const text = mainText.value
    if (text.trim()) {
      handleTextInput()
    } else {
      // clear if no text
      tweets = []
      updateDisplay()
    }
  }

  const buildTweetsFromParts = (baseParts) => {
    // create clean base tweets (no indicators)
    const baseTweets = createInitialTweets(baseParts)

    // generate display tweets from base tweets
    tweets = generateDisplayTweets(baseTweets)

    updateDisplay()
  }

  // clear all content
  const clearAll = () => {
    mainText.value = ''
    tweets = []
    updateDisplay()
  }

  // create individual tweet card HTML
  const createTweetCard = (tweet, index) => {
    const charCount = tweet.text.length
    const isOverLimit = charCount > maxLength
    const remaining = maxLength - charCount

    return `
            <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow ${tweet.copied ? 'tweet-copied' : ''}" 
               data-tweet-id="${tweet.id}" data-index="${index}">
              <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    ${index + 1}
                  </div>
                  <span class="text-sm text-gray-400">Tweet ${index + 1}/${tweets.length}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono ${isOverLimit ? 'text-red-400 font-bold' : remaining < 20 ? 'text-yellow-400' : 'text-gray-400'}">
                    ${isOverLimit ? `+${Math.abs(remaining)}` : remaining}
                  </span>
                  <button class="copy-btn text-blue-400 hover:text-blue-300 text-sm font-medium">
                    Copy
                  </button>
                </div>
              </div>
                
              <div class="tweet-content ${isOverLimit ? 'border-red-600 bg-red-900/20' : ''}">
                <div class="tweet-display p-3 bg-gray-700 rounded-lg text-white text-base leading-relaxed break-words">
                  ${textUtils.formatTextForDisplay(tweet.text)}
                </div>
              </div>
                
              ${isOverLimit ? `
                <div class="mt-2 text-sm text-red-400 font-medium">
                  ⚠️ Over limit by ${Math.abs(remaining)} characters
                </div>
              ` : ''}
            </div>
           `
  }

  // track next uncopied for copy next feature
  const getNextUncopiedIndex = () => {
    return tweets.findIndex(tweet => !tweet.copied)
  }

  // url fragment parameters
  const getHashParam = (key, defaultValue) => {
    const params = parseUrlHash()
    const val = params.get(key)
    if (val === 'y' || val === '1') return true
    if (val === 'n' || val === '0') return false
    return defaultValue ?? null
  }

  // compute thread indicator for tweet position
  const getIndicator = (i, total, omit = false) => {
    if (omit) return ''
    if (i === 0) return '\n\n🧵'
    if (i === total - 1) return '\n\n/End'
    return `\n\n${i + 1}/${total}`
  }

  // handle text input changes
  const handleTextInput = () => {
    const text = mainText.value.trim()
    const cursorPos = mainText.selectionStart
    const textLength = mainText.value.length

    // determine if cursor is at/near end
    const isAtEnd = cursorPos >= textLength - 10

    // if going from no tweets to tweets, mark as initial render
    if (tweets.length === 0 && text.length > 0) {
      isInitialRender = true
    }

    tweets = []

    if (text.length === 0) {
      updateDisplay()
      return
    }

    const baseParts = splitIntoParts(mainText.value)
    buildTweetsFromParts(baseParts)
    lastText = mainText.value

    // scroll preview pane to bottom if typing at end
    if (isAtEnd) {
      scrollToTweet('end')
    }
  }

  // initialize utilities and DOM elements
  const initializeElements = () => {
    // check if utilities available
    if (!window.textUtils || !window.domUtils || !window.animationUtils) {
        console.error('Utilities not loaded! Ensure utils.js loaded before twitter-thread-composer.js')
        return false
    }

    // explicit utility references
    textUtils = window.textUtils
    domUtils = window.domUtils
    animationUtils = window.animationUtils

    mainText = document.getElementById('mainText')
    charCounter = document.getElementById('charCounter')
    threadPreview = document.getElementById('threadPreview')
    emptyState = document.getElementById('emptyState')

    copyNext = document.getElementById('copyNext')
    resetCopy = document.getElementById('resetCopy')

    animationToggle = document.getElementById('animationToggle')
    threadIndicators = document.getElementById('threadIndicators')
  }

  // insert separator at cursor position
  const insertSeparator = () => {
    const cursorPos = mainText.selectionStart
    const text = mainText.value
    const beforeCursor = text.substring(0, cursorPos)
    const afterCursor = text.substring(cursorPos)

    const separator = beforeCursor.endsWith('\n') ? '---\n' : '\n---\n'
    const newText = beforeCursor + separator + afterCursor

    mainText.value = newText
    mainText.focus()

    const newCursorPos = cursorPos + separator.length
    mainText.setSelectionRange(newCursorPos, newCursorPos)

    handleTextInput()
  }

  // URL fragment to key-val params
  const parseUrlHash = () => {
    const hash = window.location.hash.substring(1) // remove '#'
    const params = new URLSearchParams(hash)
    return params
  }

  const setAnimationsEnabled = (enabled) => {
    animationsEnabled = enabled
    setHashParam('ani', enabled ? 'y' : 'n')

    // sync checkbox
    const checkbox = document.getElementById('animationToggle')
    if (checkbox) checkbox.checked = enabled
  }

  // key-val params to URL fragment
  const setHashParam = (key, val) => {
    const params = parseUrlHash()
    if (val === null || val === undefined) {
      params.delete(key)
    } else {
      params.set(key, val)
    }
    const newHash = params.toString()
    window.location.hash = newHash ? `#${newHash}` : ''
  }

  // setup event listeners
  const setupEventListeners = () => {
    setupButtonAnimations()
    setupCoreListeners()
    setupCopyListeners()
  }

  // setup event listener for a tweet card
  const setupTweetCardListeners = (card) => {
    const tweetId = parseInt(card.dataset.tweetId)

    // copy button
    const copyBtn = card.querySelector('.copy-btn')
    if (copyBtn && !copyBtn.hasAttribute('data-listener-attached')) {
      copyBtn.setAttribute('data-listener-attached', 'true')
      copyBtn.addEventListener('click', async (e) => {
        const tweet = tweets.find(t => t.id === tweetId)
        const success = await domUtils.copyToClipboard(tweet.text)
        if (success) {
          tweet.copied = true
          const originalText = copyBtn.textContent
          const originalClass = copyBtn.className

          copyBtn.style.transform = 'scale(1.1)'
          copyBtn.style.transition = 'all 0.15s ease-out'
          copyBtn.textContent = 'Copied!'
          copyBtn.className = 'copy-btn text-green-400 font-medium text-sm'

          setTimeout(() => {
            copyBtn.style.transform = 'scale(1)'
            setTimeout(() => {
              copyBtn.textContent = originalText
              copyBtn.className = originalClass
              updateDisplay()
            }, 300)
          }, 100)
        }
      })
    }
  }

  // split text into tweet parts (strings only, no objects)
  const splitIntoParts = (text) => {
    const parts = []
    const manualSections = textUtils.parseManualSeparators(text)

    manualSections.forEach((section) => {
      section = section.trim()
      if (section) {
        let remaining = section
        while (remaining.length > maxLength) {
          const splitPoint = textUtils.findOptimalSplitPoint(remaining, maxLength)
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

  // update character counter
  const updateCharCounter = () => {
    const totalChars = mainText.value.length
    const tweetCount = tweets.length

    let newText, newClass

    if (totalChars === 0) {
      newText = '0 characters'
      newClass = 'text-sm font-medium text-gray-400'
    } else if (tweetCount === 1 && totalChars <= maxLength) {
      const remaining = maxLength - totalChars
      newText = `${remaining} characters remaining`
      newClass = remaining > 20
        ? 'text-sm font-medium text-green-400'
        : 'text-sm font-medium text-yellow-400'
    } else {
      newText = `${totalChars} characters → ${tweetCount} tweets`
      newClass = 'text-sm font-medium text-blue-400'
    }

    // animate counter change if text actually changed
    if (charCounter.textContent !== newText) {
      // quick fade out, change text, fade in
      animationUtils.fadeElement(charCounter, 'out', 100).then(() => {
        charCounter.textContent = newText
        charCounter.className = newClass
        animationUtils.fadeElement(charCounter, 'in', 100)
      })
    }
  }

  // update copy next button state and text
  const updateCopyNextButton = () => {
    const total = tweets.length
    if (total === 0) {
      copyNext.textContent = 'Copy Next'
      copyNext.disabled = true
      copyNext.classList.add('opacity-50', 'cursor-not-allowed')
      return
    }

    const nextIndex = getNextUncopiedIndex()
    if (nextIndex === -1) {
      copyNext.textContent = 'Tweets Copied'
      copyNext.disabled = true
      copyNext.classList.add('opacity-50', 'cursor-not-allowed')
    } else {
      copyNext.textContent = `Copy ${nextIndex + 1}/${total}`
      copyNext.disabled = false
      copyNext.classList.remove('opacity-50', 'cursor-not-allowed')
    }
  }

  // update all displays
  const updateDisplay = () => {
    updateCharCounter()
    updateThreadPreview()
    updateCopyNextButton()

    // animate tweet count if changed
    if (tweets.length !== previousTweetCount) {
      animateTweetCount(previousTweetCount, tweets.length)
      previousTweetCount = tweets.length
    }
  }

  // update thread preview
  const updateThreadPreview = async () => {
    if (tweets.length === 0) {
      // going to empty state
      if (await handleEmptyState()) {
        lastRenderedTweets = []
      }
      return
    }

    // only update if tweets actually changed
    if (!checkTweetsChanged()) return

    // hide empty state if it's showing
    if (emptyState.style.display !== 'none') {
      if (animationsEnabled) {
        await animationUtils.fadeElement(emptyState, 'out', 200)
      }
      emptyState.style.display = 'none'
    }

    // show thread preview
    threadPreview.style.display = 'block'
    threadPreview.style.opacity = '1' // ensure container is visible

    // find which tweets need updating
    removeDeletedCards()
    updateOrAddCards()

    lastRenderedTweets = JSON.parse(JSON.stringify(tweets))
  }

  // public API
  const init = () => {
    initializeElements()

    animationsEnabled = getHashParam('ani', false)
    if (animationsEnabled) animationToggle.checked = animationsEnabled

    includeThreadIndicators = getHashParam('ind', false)
    if (threadIndicators) threadIndicators.checked = includeThreadIndicators

    setupEventListeners()
    updateDisplay()
    lastText = mainText.value

    // process any text starting in the composer on page load
    if (mainText.value.trim()) {
      handleTextInput()
    }
  }

  // return public interface
  return {
    init,
    addEmptyTweet,
    autoSplit,
    clearAll,
    getMaxLength: () => maxLength,
    getTweetCount: () => tweets.length,
    getTweets: () => [...tweets], // return copy to prevent external mutation
  }
}

// initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const composer = createTwitterThreadComposer()
  composer.init()

  // optionally expose to global scope for debugging
  window.twitterComposer = composer
})
