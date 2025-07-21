// /js/twitter-thread-composer.js

const createTwitterThreadComposer = () => {
  let tweets = []
  const maxLength = 280

  // get utility references (after DOM ready)
  let textUtils
  let domUtils
  let storageUtils
  let animationUtils

  // DOM elements
  let mainText
  let charCounter
  let threadPreview
  let emptyState

  let previousTweetCount = 0

  // initialize utilities and DOM elements
  const initializeElements = () => {
    // check if utilities available
    if (!window.textUtils || !window.domUtils || !window.animationUtils) {
        console.error('Utilities not loaded! Ensure utils.js loaded before twitter-thread-composer.js')
        return false
    }
    console.debug('All utilities loaded successfully') // devtest

    // explicit utility references
    textUtils = window.textUtils
    domUtils = window.domUtils
    storageUtils = window.storageUtils
    animationUtils = window.animationUtils

    mainText = document.getElementById('mainText')
    charCounter = document.getElementById('charCounter')
    threadPreview = document.getElementById('threadPreview')
    emptyState = document.getElementById('emptyState')

    console.debug('DOM elements:', { mainText, charCounter, threadPreview, emptyState }) // devtest
  }

  // setup event listeners
  const setupEventListeners = () => {
    mainText.addEventListener('input', handleTextInput)

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

    document.getElementById('autoSplit').addEventListener('click', autoSplit)
    document.getElementById('clearAll').addEventListener('click', clearAll)
    document.getElementById('addTweet').addEventListener('click', addEmptyTweet)
    document.getElementById('insertSeparator').addEventListener('click', insertSeparator)
  }

  // handle text input changes
  const handleTextInput = () => {
    const text = mainText.value
    console.debug('handleTextInput called, text length:', text.length) // devtest

    if (text.length === 0) {
      tweets = []
    } else {
      // split by manual separators first
      const manualSections = textUtils.parseManualSeparators(text)
      tweets = []

      // auto-split each section if needed
      manualSections.forEach(section => {
        if (section.trim().length > 0) {
          if (section.length <= maxLength) {
            tweets.push({ text: section.trim(), id: Date.now() + Math.random() })
          } else {
            tweets.push(...smartSplit(section.trim()))
          }
        }
      })

      // if no manual separators and single section over limit, auto-split
      if (manualSections.length === 1 && text.length > maxLength) {
        tweets = smartSplit(text.trim())
      }
    }

    console.debug('Final tweets array:', tweets) // devtest
    updateDisplay()
  }

  // smart text-splitting algorithm
  const smartSplit = (text) => {
    const splitTweets = []
    let remaining = text
    let id = Date.now()

    while (remaining.length > maxLength) {
      const splitPoint = textUtils.findOptimalSplitPoint(remaining, maxLength)

      splitTweets.push({
        text: remaining.substring(0, splitPoint).trim(),
        id: id++
      })

      remaining = remaining.substring(splitPoint).trim()
    }

    if (remaining.length > 0) {
      splitTweets.push({
        text: remaining,
        id: id++
      })
    }

    return splitTweets
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

  // auto-split current text
  const autoSplit = () => {
    const text = mainText.value
    if (text.trim()) {
      tweets = smartSplit(text.trim())
      updateDisplay()
    }
  }

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

  // clear all content
  const clearAll = () => {
    mainText.value = ''
    tweets = []
    updateDisplay()
  }

  // delete specific tweet
  const deleteTweet = (id) => {
    tweets = tweets.filter(tweet => tweet.id !== id)
    rebuildMainText()
    updateDisplay()
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

  // rebuild main text from tweets
  const rebuildMainText = () => {
    mainText.value = tweets.map(t => t.text).join(' ')
  }

  // move tweet to different position
  const moveTweet = (fromIndex, toIndex) => {
    const tweet = tweets.splice(fromIndex, 1)[0]
    tweets.splice(toIndex, 0, tweet)
    rebuildMainText()
    updateDisplay()
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

  // update thread preview
  const updateThreadPreview = async () => {
    console.debug('updateThreadPreview called, tweets.length:', tweets.length) // devtest

    if (tweets.length === 0) {
      console.debug('No tweets, showing empty state') // devtest

      await animationUtils.fadeElement(threadPreview, 'out', 200)
      threadPreview.style.display = 'none'
      emptyState.style.display = 'block'
      await animationUtils.fadeElement(emptyState, 'in', 200)
      console.debug('Empty state should now be visible') // devtest
      return
    }

    console.debug('Tweets exist, hiding empty state and showing preview') // devtest
    await animationUtils.fadeElement(emptyState, 'out', 200)
    emptyState.style.display = 'none'
    threadPreview.style.display = 'block'

    console.debug('About to set innerHTML') // devtest
    threadPreview.innerHTML = tweets.map((tweet, index) =>
        createTweetCard(tweet, index)
    ).join('')
    console.debug('innerHTML set, checking threadPreview.children:', threadPreview.children.length) // devtest

    threadPreview.style.opacity = '1'

    // animate new cards in with staggered timing
    const tweetCards = threadPreview.querySelectorAll('[data-tweet-id]')
    console.debug('Found tweetCards:', tweetCards.length) // devtest
    tweetCards.forEach((card, index) => {
        card.style.opacity = '0'
        card.style.transform = 'translateY(20px)'

        setTimeout(() => {
            // animationUtils.fadeElement(card, 'in', 300)
            card.style.opacity = '1'
            card.style.transform = 'translateY(0)'
            card.style.transition = 'transform 0.3s ease-out'
        }, index * 50) // stagger by 50ms
    })

    setupTweetCardListeners()
  }

  // create individual tweet card HTML
  const createTweetCard = (tweet, index) => {
    const charCount = tweet.text.length
    const isOverLimit = charCount > maxLength
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
                    <div class="tweet-display p-3 bg-gray-700 rounded-lg text-white text-base leading-relaxed whitespace-pre-wrap break-words">
                        ${textUtils.escapeHtml(tweet.text)}
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

  // setup event listeners for tweet cards
  const setupTweetCardListeners = () => {
    // copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tweetId = parseInt(e.target.closest('[data-tweet-id]').dataset.tweetId)
        const tweet = tweets.find(t => t.id === tweetId)

        const success = await domUtils.copyToClipboard(tweet.text)
        if (success) {
          // animate the button transformation
          const originalText = btn.textContent
          const originalClass = btn.className

          // scale up slightly and change color
          btn.style.transform = 'scale(1.1)'
          btn.style.transition = 'all 0.15s ease-out'
          btn.textContent = 'Copied!'
          btn.className = 'copy-btn text-green-400 font-medium text-sm'

          setTimeout(() => {
            btn.style.transform = 'scale(1)'
            setTimeout(() => {
              btn.textContent = originalText
              btn.className = originalClass
            }, 300)
          }, 100)
        }
      })
    })

    // edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tweetCard = e.target.closest('[data-tweet-id]')
        const tweetDisplay = tweetCard.querySelector('.tweet-display')
        const tweetEdit = tweetCard.querySelector('.tweet-edit')

        if (tweetDisplay.classList.contains('hidden')) {
          // save and show display
          const newText = tweetEdit.value
          const tweetId = parseInt(tweetCard.dataset.tweetId)
          updateTweetText(tweetId, newText)

          tweetDisplay.classList.remove('hidden')
          tweetEdit.classList.add('hidden')
          btn.textContent = 'Edit'
          btn.className = 'edit-btn text-green-400 hover:text-green-300 text-sm font-medium'
        } else {
          // show edit mode
          tweetDisplay.classList.add('hidden')
          tweetEdit.classList.remove('hidden')
          tweetEdit.focus()
          btn.textContent = 'Save'
          btn.className = 'edit-btn text-blue-400 hover:text-blue-300 text-sm font-medium'
        }
      })
    })

    // delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tweetCard = e.target.closest('[data-tweet-id]')
        const tweetId = parseInt(tweetCard.dataset.tweetId)

        // Animate the card out before deleting
        tweetCard.style.transform = 'scale(0.95)'
        tweetCard.style.transition = 'all 0.2s ease-out'

        await animationUtils.fadeElement(tweetCard, 'out', 200)
        await animationUtils.slideElement(tweetCard, 'up', 200)

        deleteTweet(tweetId)
      })
    })

    // auto-save on textarea blur
    document.querySelectorAll('textarea[data-tweet-id]').forEach(textarea => {
      textarea.addEventListener('blur', (e) => {
        const tweetId = parseInt(e.target.dataset.tweetId)
        updateTweetText(tweetId, e.target.value)
      })
    })
  }

  // public API
  const init = () => {
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
