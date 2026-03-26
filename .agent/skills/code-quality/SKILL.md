---
name: Code Quality & Linting
description: ESLint, Prettier, naming conventions, documentation standards, and code review checklist for PIXLAYER
---

# Code Quality & Linting

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| React Components | PascalCase | `LayerPanel.jsx`, `ExportModal.jsx` |
| Hooks | camelCase + `use` prefix | `useCanvas.js`, `useSegmentation.js` |
| Stores | camelCase + `Store` suffix | `editorStore.js` |
| Utils/Libs | camelCase | `apiClient.js`, `psdExporter.js` |
| CSS files | camelCase or kebab-case | `global.css`, `editor-panel.css` |
| Backend routes | kebab-case | `auth.js`, `segmentation.js` |
| Models | PascalCase | `User.js`, `Project.js` |
| Env variables | SCREAMING_SNAKE_CASE | `JWT_SECRET`, `MONGODB_URI` |
| CSS variables | kebab with `--px-` prefix | `--px-accent`, `--px-bg` |

## File Structure Rules
1. **One component per file** — no multi-export component files
2. **Index exports** — each `components/` subfolder may have `index.js` for barrel exports
3. **Colocation** — keep related styles, hooks, and utils close to their consumers
4. **Max file length** — aim for < 300 lines per file. Split if larger.

## Import Ordering (enforced by ESLint)
```js
// 1. React / framework
// 2. Third-party libs (alphabetical)
// 3. Internal stores / hooks
// 4. Internal components
// 5. Utils / constants / types
// 6. Styles / assets
```

## ESLint Configuration
```js
// .eslintrc.cjs (client)
module.exports = {
  env: { browser: true, es2022: true },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  settings: { react: { version: 'detect' } },
  rules: {
    'react/react-in-jsx-scope': 'off',       // Not needed with Vite
    'react/prop-types': 'off',                // Use JSDoc or TypeScript later
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

## Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

## Documentation Standards

### Function JSDoc
```js
/**
 * Extracts masked pixels from the canvas as a new layer.
 * @param {HTMLCanvasElement} canvas - Source canvas element
 * @param {ImageData} mask - Binary mask (255 = include, 0 = exclude)
 * @param {{ x: number, y: number, w: number, h: number }} bounds - Bounding box
 * @returns {{ id: string, name: string, imageData: ImageData, bounds: object }}
 */
export function extractLayer(canvas, mask, bounds) { /* ... */ }
```

### Component JSDoc
```jsx
/**
 * Layer panel item with visibility toggle, lock, and drag handle.
 * @param {{ layer: object, isActive: boolean, onSelect: function, onToggle: function }} props
 */
export default function LayerItem({ layer, isActive, onSelect, onToggle }) { /* ... */ }
```

## Git Commit Conventions
```
feat: add SVG export with VTracer WASM
fix: resolve canvas DPI scaling on retina displays
refactor: extract auth middleware into separate module
style: apply Prettier formatting to editor components
chore: update onnxruntime-web to 1.19.0
docs: add API endpoint documentation
perf: add LRU cache for SAM2 embeddings
```

## Code Review Checklist
- [ ] No hardcoded values (colors, URLs, secrets)
- [ ] All API calls have error handling (try/catch or .catch)
- [ ] No `console.log` (use `console.warn`/`console.error` only)
- [ ] Zustand selectors are specific (no full-store destructuring)
- [ ] Canvas operations happen in requestAnimationFrame or useEffect
- [ ] All user inputs are validated (frontend + backend)
- [ ] Loading states exist for all async operations
- [ ] Keyboard shortcuts don't conflict with browser defaults
- [ ] Animations are 150ms with ease timing
- [ ] Dark theme tokens used (no hardcoded colors)
