# X-Thread

Improved X/Twitter composer: Auto-threader always-on character counter, and draft auto-save

## Features

- **Automatic thread splitting** at 280 characters using smart boundaries (sentences → paragraphs → lines → words)
- **Manual separators** with `---` syntax for precise control
- **Thread indicators** (optional: 🧵, numbering, /End)
- **Copy system** with individual and sequential copying
- **Draft auto-save** with browser localStorage persistence
- **Real-time preview** with debounced input processing
- **Smart character counter** with context-aware display

## Draft System

- Auto-saves as you type (300ms debounce)
- Persists between browser sessions
- Automatic backup on page unload
- Browser-only storage (~5MB limit)
- Smart recovery on app restart

## Usage

1. Start typing your thread content
2. Use `---` on its own line to manually split tweets
3. Enable thread indicators for numbered sequences
4. Copy on individual tweets, or use "Copy Next" for sequential copying
5. Your work auto-saves - no need to worry about losing progress

## Manual Controls

- **Auto Split**: Process current text into optimal tweet splits (usually happens automatically)
- **Clear Editor**: Remove all text (session only)
- **Insert ---**: Add manual separator at cursor
- **Clear Draft**: Remove saved draft from browser local storage
