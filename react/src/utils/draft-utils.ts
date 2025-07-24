// /react/src/utils/draft-utils.ts

interface DraftData {
  text: string
  timestamp: number
}

export const createDraftUtils = () => {
  const DRAFT_KEY = 'x-thread-draft'

  const clearDraft = (): boolean => {
    try {
      localStorage.removeItem(DRAFT_KEY)
      return true
    } catch (error) {
      console.log('failed to clear draft from localStorage:', error)
      return false
    }
  }

  const getDraftTimestamp = (): number | null => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY)
      if (!stored) return null

      const draft: DraftData = JSON.parse(stored)
      return draft.timestamp || null
    } catch (error) {
      console.log('failed to get draft timestamp from localStorage:', error)
      return null
    }
  }

  const loadDraft = (): string | null => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY)
      if (!stored) return null

      const draft: DraftData = JSON.parse(stored)
      return draft.text || null
    } catch (error) {
      console.log('failed to load draft from localStorage:', error)
      return null
    }
  }

  const saveDraft = (text: string): boolean => {
    try {
      const draft: DraftData = {
        text: text,
        timestamp: Date.now()
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      return true
    } catch (error) {
      // check if localStorage full
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('localStorage full; clearing draft to make space')
        clearDraft()
        return false // will trigger toast in calling code
      }

      console.log('failed to save draft to localStorage:', error)
      return false
    }
  }

  return {
    clearDraft,
    getDraftTimestamp,
    loadDraft,
    saveDraft,
  }
}

export const draftUtils = createDraftUtils()
