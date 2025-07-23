// /react/src/types/index.ts

export interface Tweet {
  id: number
  baseText: string
  text: string
  copied: boolean
  omitIndicator: boolean
}

export interface AppState {
  tweets: Tweet[]
  includeThreadIndicators: boolean
  animationsEnabled: boolean
}

export interface TextStats {
  characters: number
  words: number
  sentences: number
  lines: number
}

export interface FeedbackController {
  timeoutId: number
  revert: () => void
}

export interface AnimationOptions {
  duration?: number
  easing?: keyof EasingFunctions
}

export interface EasingFunctions {
  linear: (t: number) => number
  easeInQuad: (t: number) => number
  easeOutQuad: (t: number) => number
  easeInOutQuad: (t: number) => number
  easeInCubic: (t: number) => number
  easeOutCubic: (t: number) => number
  easeInOutCubic: (t: number) => number
}

export interface ScrollOptions {
  behavior?: 'smooth' | 'instant'
  block?: 'start' | 'center' | 'end' | 'nearest'
  inline?: 'start' | 'center' | 'end' | 'nearest'
}
