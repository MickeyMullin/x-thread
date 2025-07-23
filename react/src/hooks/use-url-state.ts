// /react/src/hooks/use-url-state.ts

import { useCallback, useEffect, useState } from 'react'

export const useUrlState = () => {
  const [urlParams, setUrlParams] = useState<URLSearchParams>(() =>
    new URLSearchParams(window.location.hash.substring(1))
  )

  const getHashParam = useCallback((key: string, defaultValue?: boolean): boolean => {
    const val = urlParams.get(key)
    if (val === 'y' || val === '1') return true
    if (val === 'n' || val === '0') return false
    return defaultValue ?? false
  }, [urlParams])

  const setHashParam = useCallback((key: string, value: boolean | null): void => {
    const newParams = new URLSearchParams(urlParams)

    if (value === null || value === undefined) {
      newParams.delete(key)
    } else {
      newParams.set(key, value ? 'y' : 'n')
    }

    const newHash = newParams.toString()
    window.location.hash = newHash ? `#${newHash}` : ''
    setUrlParams(newParams)
  }, [urlParams])

  useEffect(() => {
    const handleHashChange = (): void => {
      setUrlParams(new URLSearchParams(window.location.hash.substring(1)))
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return { getHashParam, setHashParam }
}
