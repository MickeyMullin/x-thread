// /react/src/hooks/use-draft.ts

import { useCallback, useEffect, useRef, useState } from 'react'
import { draftUtils } from '@/utils/draft-utils'
import { toastUtils } from '@/utils/toast-utils'
import { DEBOUNCE_DELAY, TOAST_DURATION } from '@/utils/constants'

interface DraftState {
  hasDraft: boolean
  lastSaved: Date | null
}

interface UseDraftReturn {
  draftState: DraftState

  autoSaveDraft: (text: string) => void
  clearDraft: () => boolean
  loadDraft: () => string | null
  saveDraft: (text: string) => boolean
}

export const useDraft = (): UseDraftReturn => {
  const [draftState, setDraftState] = useState<DraftState>({
    hasDraft: false,
    lastSaved: null
  })

  const autoSaveTimeoutRef = useRef<number>()
  const AUTOSAVE_DELAY = DEBOUNCE_DELAY // match debounce delay

    const autoSaveDraft = useCallback((text: string): void => {
    // clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    if (!text.trim()) {
      // clear draft when text is empty
      clearDraft()
      return
    }

    // set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDraft(text)
    }, AUTOSAVE_DELAY)
  }, [])

  const clearDraft = useCallback((): boolean => {
    const success = draftUtils.clearDraft()

    if (success) {
      updateDraftState(false)
    }

    return success
  }, [])

  const loadDraft = useCallback((): string | null => {
    const draftText = draftUtils.loadDraft()

    if (draftText) {
      const timestamp = draftUtils.getDraftTimestamp()
      updateDraftState(true, timestamp || undefined)
      return draftText
    }

    updateDraftState(false)
    return null
  }, [])

  const saveDraft = useCallback((text: string): boolean => {
    const success = draftUtils.saveDraft(text)

    if (success) {
      updateDraftState(true, Date.now())
    } else {
      // check if it was a quota error by trying to get timestamp
      const timestamp = draftUtils.getDraftTimestamp()
      if (timestamp === null) {
        // was quota error, draft was cleared
        updateDraftState(false)
        toastUtils.showToast('Storage full; draft cleared', TOAST_DURATION)
      }
    }

    return success
  }, [])

  const updateDraftState = (saved: boolean, timestamp?: number): void => {
    setDraftState({
      hasDraft: saved,
      lastSaved: saved && timestamp ? new Date(timestamp) : null
    })
  }

  // cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // beforeunload backup save
  useEffect(() => {
    // const handleBeforeUnload = (text: string) => {
    //   if (text.trim()) {
    //     draftUtils.saveDraft(text)
    //   }
    // }

    // note: we'll need to pass current text from the calling component
    // this is a placeholder - actual implementation will be in App component
    return () => {
      // cleanup if needed
    }
  }, [])

  return {
    draftState,

    autoSaveDraft,
    clearDraft,
    loadDraft,
    saveDraft,
  }
}
