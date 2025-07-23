# X-Thread Composer (React)

React + TypeScript port of the X-Thread Composer app.

## Features

- **Automatic thread splitting** at 280 characters using smart boundaries
- **Manual separators** with `---` syntax
- **Thread indicators** (optional 🧵, numbering, /End)
- **Copy system** with individual and sequential copying
- **Real-time preview** with debounced input
- **URL state persistence** for settings
- **Smart scrolling** and animations

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** + SCSS for styling
- **Factory pattern utilities** (textUtils, domUtils, etc.)
- **Custom hooks** for debouncing, thread splitting, URL state

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Key Patterns
- **Functional components** with hooks
- **Factory functions** for utilities (maintains consistency with vanilla version)
- **Custom hooks** for complex logic (`useThreadSplitter`, `useDebounce`)
- **Derived state** pattern (base tweets → display tweets)

### File Structure
```
src/
├── components/       # React components
├── hooks/            # Custom React hooks
├── utils/            # Factory-based utilities
├── types/            # TypeScript interfaces
└── styles/           # SCSS + Tailwind
```

### State Management
- React's built-in state management (`useState`, `useMemo`)
- Ready for localStorage integration (future enhancement)
- URL hash for settings persistence

## Migration Notes

This React version maintains feature parity with the vanilla JavaScript version while leveraging React's reactive patterns for cleaner state management and UI updates.
