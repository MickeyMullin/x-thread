# X-Thread Composer

Improved X/Twitter composer with automatic thread splitting, character counter, and draft auto-save

## Live Demo

- **React Version**: [https://mickeymullin.github.io/x-thread/](https://mickeymullin.github.io/x-thread/)
- **Vanilla JS Version**: [https://mickeymullin.github.io/x-thread/vanillajs/](https://mickeymullin.github.io/x-thread/vanillajs/)

## Features

- **Automatic thread splitting** at 280 characters using smart boundaries (sentences → paragraphs → lines → words)
- **Manual separators** with `---` syntax for precise control
- **Thread indicators** (optional: 🧵, numbering, /End)
- **Copy system** with individual and sequential copying
- **Draft auto-save** with browser localStorage persistence
- **Real-time preview** with debounced input processing
- **Smart character counter** with context-aware display

## Versions

### React + TypeScript ([/react](/react))

Modern implementation with:

- React 18 + TypeScript
- Vite build tooling
- Tailwind CSS + SCSS
- Custom hooks and factory pattern utilities
- Ready for extension and integration

### Vanilla JavaScript ([/vanillajs](/vanillajs))

Lightweight implementation with:

- Pure JavaScript (ES6+)
- Factory pattern utilities
- Tailwind CSS
- No build process required
- Easy to embed or customize

## Use Cases

- **Content creators** planning Twitter threads
- **Marketers** drafting social media campaigns  
- **Writers** breaking long-form content into tweet sequences
- **Anyone** who wants to compose threads before posting

## Documentation

- [React Version Documentation](./react/README.md)
- [Vanilla JS Version Documentation](./vanillajs/README.md)

## 🛠️ Development

Each version has its own development setup:

```bash
# React version
cd react
npm install
npm run dev

# Vanilla JS version  
cd vanillajs
# Open index.html in browser or serve with local server
```

## License

MIT License - feel free to use this in your own projects

## Contributing

Issues and pull requests welcome. Check the individual version READMEs for specific development guidelines.
