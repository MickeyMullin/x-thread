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

  // let suppressConfirm = false
  // let suppressConfirmCheckbox
  // let lastText = ''

  // buttons for copy features
  let copyNext
  let copyNextFeedbackTimeout = null
  let resetCopy

  let animationsEnabled = false
  let animationToggle

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

  // apply thread indicators with splitting
  const applyThreadIndicators = (tweets) => {
    if (!includeThreadIndicators) return

    let i = 0
    while (i < tweets.length) {
      const total = tweets.length
      const indicator = getIndicator(i, total)
      const fullLen = tweets[i].baseText.length + indicator.length

      if (fullLen > maxLength) {
        // tweet text plus indicator > maxLength
        if (i === total - 1) {
          // omit if the final tweet would go over with '/End' indicator
          tweets[i].omitIndicator = true
          i++
        } else {
          const indicatorLen = indicator.length
          const splitPoint = textUtils.findOptimalSplitPoint(tweets[i].baseText, maxLength - indicatorLen)

          if (splitPoint > 0) {
            const part1 = tweets[i].baseText.substring(0, splitPoint).trim()
            const part2 = tweets[i].baseText.substring(splitPoint).trim()
            tweets[i].baseText = part1

            const newTweet = {
              baseText: part2,
              id: Date.now() + i + 1,
              copied: false,
              omitIndicator: false,
              // text: part2 || '', // no?
            }

            tweets.splice(i + 1, 0, newTweet)
            i++
          } else {
            tweets[i].omitIndicator = true
            i++
          }
        }
      } else {
        i++
      }
    }
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

  // set final tweet text with indicators
  const finalizeTweetText = (tweets) => {
    if (includeThreadIndicators) {
      for (let i = 0; i < tweets.length; i++) {
        const indicator = getIndicator(i, tweets.length, tweets[i].omitIndicator)
        tweets[i].text = tweets[i].baseText + indicator
      }
    } else {
      tweets.forEach(tweet => {
        tweet.text = tweet.baseText
      })
    }
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
      const card = threadPreview.querySelector(`[data-tweet-id="${tweet.id}"]`)
      const success = await domUtils.copyToClipboard(tweet.text)

      if (success) {
        tweet.copied = true

        if (card) {
          domUtils.scrollToElement(card, { behavior: 'smooth', block: 'start' })
        }

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

    // TODO: fix copy-edit confirmation
    // mainText.addEventListener('input', () => {
    //   const hasCopied = tweets.some(tweet => tweet.copied)
    //   const allCopied = tweets.every(tweet => tweet.copied)
    //   if (!hasCopied || allCopied || suppressConfirm) {
    //     return
    //   }

    //   if (!confirm('Editing will reset copy states. Proceed?')) {
    //     mainText.value = lastText
    //     // restore cursor to end
    //     mainText.setSelectionRange(lastText.length, lastText.length)
    //     return
    //   }

    //   // if confirmed, allow debounced handler to proceed
    // })

    // suppress "are you sure" confirmation if editing while only some tweets are copied
    suppressConfirmCheckbox.addEventListener('change', (e) => { suppressConfirm = e.target.checked })

    threadIndicators.addEventListener('change', (e) => {
      includeThreadIndicators = e.target.checked
      setHashParam('ind', e.target.checked ? 'y' : 'n')
      updateDisplay() // refresh to apply/remove indicators later
    })
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

        if (animationsEnabled) {
          card.style.opacity = '0'
          card.style.transform = 'translateY(20px)'
          setTimeout(() => {
            card.style.opacity = '1'
            card.style.transform = 'translateY(0)'
            card.style.transition = 'transform 0.3s ease-out'
          }, idx * 50)
        }
      } else {
        // handle copying
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
      const parts = splitIntoParts(text)
      buildTweetsFromParts(parts)
    }
  }

  const buildTweetsFromParts = (baseParts) => {
    tweets = createInitialTweets(baseParts)
    applyThreadIndicators(tweets)
    finalizeTweetText(tweets)
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
                        <span class="text-xs font-mono ${isOverLimit ? 'text-red-400 font-bold' :
        remaining < 20 ? 'text-yellow-400' : 'text-gray-400'
      }">
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
    tweets = []

    if (text.length === 0) {
      updateDisplay()
      return
    }

    const baseParts = splitIntoParts(mainText.value)
    buildTweetsFromParts(baseParts)
    lastText = mainText.value
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

    suppressConfirmCheckbox = document.getElementById('suppressConfirm')

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
      if (await handleEmptyState()) {
        lastRenderedTweets = []
        return
      }
    }

    // only update if tweets actually changed
    if (!checkTweetsChanged()) return

    if (animationsEnabled) {
      await animationUtils.fadeElement(emptyState, 'out', 200)
    }
    emptyState.style.display = 'none'
    threadPreview.style.display = 'block'

    // find which tweets need updating
    removeDeletedCards()
    updateOrAddCards()

    threadPreview.style.opacity = '1'
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
  }

  // return public interface
  return {
    init,
    // expose methods that might be useful for testing or external use
    autoSplit,
    clearAll,
    addEmptyTweet,
    getTweets: () => [...tweets], // return copy to prevent external mutation
    getTweetCount: () => tweets.length,
    getMaxLength: () => maxLength
  }
}

// initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const composer = createTwitterThreadComposer()
  composer.init()

  // optionally expose to global scope for debugging
  window.twitterComposer = composer
})
