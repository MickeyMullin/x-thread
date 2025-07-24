# X-Thread Composer (Vanilla JavaScript)

Lightweight X/Twitter composer: Auto-threader, always-on character counter, and draft auto-save; no build required

## Features

- **Automatic thread splitting** at 280 characters using smart boundaries (sentences → paragraphs → lines → words)
- **Manual separators** with `---` syntax for precise control
- **Thread indicators** (optional: 🧵, numbering, /End)
- **Copy system** with individual and sequential copying
- **Draft auto-save** with browser localStorage persistence
- **Real-time preview** with debounced input processing
- **Smart character counter** with context-aware display

## 📂 File Structure

```
vanillajs/
├── index.html          # main application
├── css/
│   └── styles.css      # pregenerated Tailwind + custom styles
├── js/
│   ├── utils.js        # factory-based utilities
│   └── x-thread-composer.js  # main application logic
├── src/
│   └── styles.css      # source for Tailwind CSS
|                       #   regenerate with `tailwindcss -i ./src/styles.css -o ./css/styles.css`
└── README.md           # this file
```

## Running Locally

### Option 1: Direct File Opening

Simply open `index.html` in your browser. Most features work, but some browsers may restrict localStorage in file:// protocol.

### Option 2: Local Server
```bash
# Node.js (if you have http-server installed)
npx http-server

# Python 3
python -m http.server 8000

# Python 2  
python -m SimpleHTTPServer 8000

# PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`



## Draft System

- **Auto-saves** as you type (300ms debounce)
- **Persists** between browser sessions
- **Automatic backup** on page unload
- **Browser-only storage** (~5MB limit)
- **Smart recovery** on app restart

## Usage

1. Start typing your thread content
2. Use `---` on its own line to manually split tweets
3. Enable thread indicators for numbered sequences
4. Copy individual tweets, or use "Copy Next" for sequential copying
5. Your work auto-saves - no need to worry about losing progress

## Manual Controls

- **Auto Split**: Process current text into optimal tweet splits (usually happens automatically)
- **Clear Editor**: Remove all text (session only)
- **Insert ---**: Add manual separator at cursor position
- **Clear Draft**: Remove saved draft from browser localStorage

## Customization

X-Thred uses factory pattern utilities for easy customization:

### Text Processing (`textUtils`)

- `findOptimalSplitPoint()` - Smart text splitting logic
- `parseManualSeparators()` - Handle `---` separators
- `formatTextForDisplay()` - HTML formatting

### DOM Utilities (`domUtils`)

- `copyToClipboard()` - Cross-browser clipboard support
- `showToast()` - Notification system
- `scrollToElement()` - Smooth scrolling

### Animation Utilities (`animationUtils`)

- `fadeElement()` - Smooth transitions
- `animateValue()` - Number animations

## Browser Support

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge
- Mobile browsers supported
- localStorage required for draft functionality

## Privacy

- **No data collection** - everything stays in your browser
- **No external requests** - works completely offline
- **localStorage only** - drafts stored locally, never sent anywhere

## Deployment

Ready to deploy as static files:

- Upload all files to any web server
- No build process required
- Works with GitHub Pages, Netlify, Vercel, etc.

## Performance

- **Lightweight**: ~20KB total (excluding Tailwind CSS)
- **Fast**: Debounced processing for smooth typing
- **Efficient**: Factory pattern prevents memory leaks
- **Responsive**: Optimized for mobile and desktop
