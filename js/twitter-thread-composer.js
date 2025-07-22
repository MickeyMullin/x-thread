// /js/twitter-thread-composer.js

const createTwitterThreadComposer = () => {
  let tweets = []
  const debounceDelay = 300
  const maxLength = 280
  const TWEET_LIMIT = 25000

  // get utility references (after DOM ready)
  let animationUtils
  let domUtils
  let storageUtils
  let textUtils

  // DOM elements
  let mainText
  let charCounter
  let threadPreview
  let emptyState

  let animationsEnabled = false
  let lastRenderedTweets = []
  let previousTweetCount = 0

  // add empty tweet
  const addEmptyTweet = () => {
    tweets.push({
      text: '',
      id: Date.now()
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
      tweets = parts.map((part, idx) => ({
        text: part,
        id: Date.now() + idx,
        allowOverLimit: false,
      }))
      updateDisplay()
    }
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
    const effectiveLimit = tweet.allowOverLimit ? TWEET_LIMIT : maxLength
    const isOverLimit = charCount > effectiveLimit
    const remaining = maxLength - charCount

    return `
            <div class="bg-gray-800 rounded-xl border border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow" 
                 data-tweet-id="${tweet.id}" data-index="${index}">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            ${index + 1}
                        </div>
                        <span class="text-sm text-gray-400">Tweet ${index + 1}/${tweets.length}</span>
                        <label class="flex items-center gap-1 text-xs text-gray-400">
                          <input type="checkbox" class="allow-over-limit-cb" data-tweet-id="${tweet.id}" ${tweet.allowOverLimit ? 'checked' : ''}>
                          Allow Overage
                        </label>
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
                        <button class="edit-btn text-green-400 hover:text-green-300 text-sm font-medium">
                            Edit
                        </button>
                        ${tweets.length > 1 ? `
                            <button class="delete-btn text-red-400 hover:text-red-300 text-sm font-medium">
                                Delete
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="tweet-content ${isOverLimit ? 'border-red-600 bg-red-900/20' : ''}">
                    <div class="tweet-display p-3 bg-gray-700 rounded-lg text-white text-base leading-relaxed break-words">
                        ${textUtils.formatTextForDisplay(tweet.text)}
                    </div>
                    <textarea 
                        class="tweet-edit w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base leading-relaxed placeholder-gray-400 hidden"
                        rows="3"
                        data-tweet-id="${tweet.id}"
                    >${tweet.text}</textarea>
                </div>
                
                ${isOverLimit ? `
                    <div class="mt-2 text-sm text-red-400 font-medium">
                        ⚠️ Over limit by ${Math.abs(remaining)} characters
                    </div>
                ` : ''}
            </div>
        `
  }

  // delete specific tweet
  const deleteTweet = (id) => {
    tweets = tweets.filter(tweet => tweet.id !== id)
    rebuildMainText()
    updateDisplay()
  }

  // animation control
  const getAnimationEnabled = () => {
    const params = parseUrlFragment()
    const aniParam = params.get('ani')
    if (aniParam === 'y' || aniParam === '1') return true
    if (aniParam === 'n' || aniParam === '0') return false
    return animationsEnabled ?? false
  }

  // handle text input changes
  const handleTextInput = () => {
    const text = mainText.value.trim()
    const oldTweets = [...tweets] // copy previous for comparison
    tweets = []

    if (text.length === 0) {
      updateDisplay()
      return
    }

    const newParts = splitIntoParts(mainText.value)

    let oldIndex = 0
    newParts.forEach((part) => {
      if (oldIndex < oldTweets.length && part === oldTweets[oldIndex].text) {
        // exact match: reuse old tweet (id and allowOverLimit)
        tweets.push({ ...oldTweets[oldIndex] })
        oldIndex++
      } else if (
        oldIndex < oldTweets.length
        && (part.startsWith(oldTweets[oldIndex].text)
          || oldTweets[oldIndex].text.startsWith(part))
      ) {
        // prefix match: assume end-change; update text, reuse id & allowOverLimit
        tweets.push({ ...oldTweets[oldIndex], text: part })
        oldIndex++
      } else {
        // true mismatch addition: fresh object
        tweets.push({
          text: part,
          id: Date.now() + Math.random(),
          allowOverLimit: false,  // reset to default for new/changed
        })
      }
    })

    updateDisplay()
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
    storageUtils = window.storageUtils
    animationUtils = window.animationUtils

    mainText = document.getElementById('mainText')
    charCounter = document.getElementById('charCounter')
    threadPreview = document.getElementById('threadPreview')
    emptyState = document.getElementById('emptyState')
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

  // move tweet to different position
  const moveTweet = (fromIndex, toIndex) => {
    const tweet = tweets.splice(fromIndex, 1)[0]
    tweets.splice(toIndex, 0, tweet)
    rebuildMainText()
    updateDisplay()
  }

  // URL fragment to key-val params
  const parseUrlFragment = () => {
    const hash = window.location.hash.substring(1) // remove '#'
    const params = new URLSearchParams(hash)
    return params
  }

  // rebuild main text from tweets
  const rebuildMainText = () => {
    mainText.value = tweets.map(t => t.text).join(' ')
  }

  const setAnimationsEnabled = (enabled) => {
    animationsEnabled = enabled
    updateUrlFragment('ani', enabled ? 'y' : 'n')

    // sync checkbox
    const checkbox = document.getElementById('animationToggle')
    if (checkbox) checkbox.checked = enabled
  }

  // setup event listeners
  const setupEventListeners = () => {
    let debounceTimer

    mainText.addEventListener('input', () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(handleTextInput, debounceDelay)
    })

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

    // apply to all main buttons
    animateButton(document.getElementById('autoSplit'))
    animateButton(document.getElementById('clearAll'))
    animateButton(document.getElementById('addTweet'))
    animateButton(document.getElementById('insertSeparator'))

    document.getElementById('animationToggle').addEventListener('change', (e) => {
      setAnimationsEnabled(e.target.checked)
    })
    document.getElementById('autoSplit').addEventListener('click', autoSplit)
    document.getElementById('addTweet').addEventListener('click', addEmptyTweet)
    document.getElementById('clearAll').addEventListener('click', clearAll)
    document.getElementById('insertSeparator').addEventListener('click', insertSeparator)
  }

  // setup event listener for a single tweet card
  const setupSingleCardListeners = (card) => {
    const tweetId = parseInt(card.dataset.tweetId)

    // copy button
    const copyBtn = card.querySelector('.copy-btn')
    if (copyBtn && !copyBtn.hasAttribute('data-listener-attached')) {
      copyBtn.setAttribute('data-listener-attached', 'true')
      copyBtn.addEventListener('click', async (e) => {
        const tweet = tweets.find(t => t.id === tweetId)
        const success = await domUtils.copyToClipboard(tweet.text)
        if (success) {
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
            }, 300)
          }, 100)
        }
      })
    }

    // edit button
    const editBtn = card.querySelector('.edit-btn')
    if (editBtn && !editBtn.hasAttribute('data-listener-attached')) {
      editBtn.setAttribute('data-listener-attached', 'true')
      editBtn.addEventListener('click', (e) => {
        const tweetDisplay = card.querySelector('.tweet-display')
        const tweetEdit = card.querySelector('.tweet-edit')

        if (tweetDisplay.classList.contains('hidden')) {
          const newText = tweetEdit.value
          updateTweetText(tweetId, newText)

          tweetDisplay.classList.remove('hidden')
          tweetEdit.classList.add('hidden')
          editBtn.textContent = 'Edit'
          editBtn.className = 'edit-btn text-green-400 hover:text-green-300 text-sm font-medium'
        } else {
          tweetDisplay.classList.add('hidden')
          tweetEdit.classList.remove('hidden')
          tweetEdit.focus()
          editBtn.textContent = 'Save'
          editBtn.className = 'edit-btn text-blue-400 hover:text-blue-300 text-sm font-medium'
        }
      })
    }

    // delete button
    const deleteBtn = card.querySelector('.delete-btn')
    if (deleteBtn && !deleteBtn.hasAttribute('data-listener-attached')) {
      deleteBtn.setAttribute('data-listener-attached', 'true')
      deleteBtn.addEventListener('click', async (e) => {
        card.style.transform = 'scale(0.95)'
        card.style.transition = 'all 0.2s ease-out'

        if (animationsEnabled) {
          await animationUtils.fadeElement(card, 'out', 200)
          await animationUtils.slideElement(card, 'up', 200)
        }

        deleteTweet(tweetId)
      })
    }

    // overflow checkbox
    const checkbox = card.querySelector('.allow-over-limit-cb')
    if (checkbox && !checkbox.hasAttribute('data-listener-attached')) {
      checkbox.setAttribute('data-listener-attached', 'true')
      checkbox.addEventListener('change', (e) => {
        const tweet = tweets.find(t => t.id === tweetId)
        if (tweet) {
          tweet.allowOverLimit = e.target.checked
          updateDisplay()
        }
      })
    }

    // textarea blur
    const textarea = card.querySelector('textarea[data-tweet-id]')
    if (textarea && !textarea.hasAttribute('data-listener-attached')) {
      textarea.setAttribute('data-listener-attached', 'true')
      textarea.addEventListener('blur', (e) => {
        updateTweetText(tweetId, e.target.value)
      })
    }
  }

  // setup event listeners for all tweet cards
  const setupTweetCardListeners = () => {
    document.querySelectorAll('[data-tweet-id]').forEach(card => {
      setupSingleCardListeners(card)
    })
  }

  // split text into tweet parts (strings only, no objects)
  const splitIntoParts = (text) => {
    const parts = []
    const manualSections = textUtils.parseManualSeparators(text)

    // TODO: will these trim()s cause issues with whitespace later?
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

  // update all displays
  const updateDisplay = () => {
    updateCharCounter()
    updateThreadPreview()

    // animate tweet count if changed
    if (tweets.length !== previousTweetCount) {
      animateTweetCount(previousTweetCount, tweets.length)
      previousTweetCount = tweets.length
    }
  }

  // update thread preview
  const updateThreadPreview = async () => {
    if (tweets.length === 0) {
      if (animationsEnabled) {
        await animationUtils.fadeElement(threadPreview, 'out', 200)
      }

      threadPreview.style.display = 'none'
      emptyState.style.display = 'block'

      if (animationsEnabled) {
        await animationUtils.fadeElement(emptyState, 'in', 200)
      }

      lastRenderedTweets = []
      return
    }

    // only update if tweets actually changed
    const tweetsChanged = tweets.length !== lastRenderedTweets.length
      || tweets.some((tweet, idx) =>
        !lastRenderedTweets[idx]
        || tweet.text !== lastRenderedTweets[idx].text
        || tweet.allowOverLimit !== lastRenderedTweets[idx].allowOverLimit
      )

    if (!tweetsChanged) {
      return
    }

    if (animationsEnabled) {
      await animationUtils.fadeElement(emptyState, 'out', 200)
    }
    emptyState.style.display = 'none'
    threadPreview.style.display = 'block'

    // find which tweets need updating
    const existingCards = threadPreview.querySelectorAll('[data-tweet-id]')
    const existingIds = Array.from(existingCards).map(card => parseInt(card.dataset.tweetId))
    const newIds = tweets.map(tweet => tweet.id)

    // remove deleted tweets
    existingCards.forEach(card => {
      const id = parseInt(card.dataset.tweetId)
      if (!newIds.includes(id)) {
        card.remove()
      }
    })

    // add or update tweets
    tweets.forEach((tweet, idx) => {
      let card = threadPreview.querySelector(`[data-tweet-id="${tweet.id}"]`)

      if (!card) {
        // create new card
        const cardHTML = createTweetCard(tweet, idx)
        threadPreview.insertAdjacentHTML('beforeend', cardHTML)
        card = threadPreview.querySelector(`[data-tweet-id="${tweet.id}"]`)

        // attach listeners to this new card
        setupSingleCardListeners(card)

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
        // update existing card content if changed
        const displayDiv = card.querySelector('.tweet-display')
        const newContent = textUtils.formatTextForDisplay(tweet.text)
        if (displayDiv.innerHTML !== newContent) {
          displayDiv.innerHTML = newContent
        }

        // update character count display
        const charSpan = card.querySelector('.text-xs.font-mono')
        const effectiveLimit = tweet.allowOverLimit ? TWEET_LIMIT : maxLength
        const remaining = effectiveLimit - tweet.text.length
        const isOverLimit = remaining < 0

        charSpan.textContent = isOverLimit ? `+${Math.abs(remaining)}` : remaining
        // TODO: move nested ternary to a char count class selector function
        charSpan.className = `text-xs font-mono ${isOverLimit ? 'text-red-400 font-bold' : remaining < 20 ? 'text-yellow-400' : 'text-gray-400'}`
      }
    })

    threadPreview.style.opacity = '1'
    lastRenderedTweets = JSON.parse(JSON.stringify(tweets))
  }

  // update tweet text
  const updateTweetText = (id, newText) => {
    const tweet = tweets.find(t => t.id === id)
    if (tweet) {
      tweet.text = newText
      rebuildMainText()

      // update display
      const tweetCard = document.querySelector(`[data-tweet-id="${id}"]`)
      if (tweetCard) {
        const displayDiv = tweetCard.querySelector('.tweet-display')
        if (displayDiv) {
          displayDiv.innerHTML = textUtils.escapeHtml(newText)
        }
      }

      updateDisplay()
    }
  }

  // key-val params to URL fragment
  const updateUrlFragment = (key, val) => {
    const params = parseUrlFragment()
    if (val === null || val === undefined) {
      params.delete(key)
    } else {
      params.set(key, val)
    }
    const newHash = params.toString()
    window.location.hash = newHash ? `#${newHash}` : ''
  }

  // public API
  const init = () => {
    animationsEnabled = getAnimationEnabled()
    initializeElements()
    setupEventListeners()
    updateDisplay()
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
