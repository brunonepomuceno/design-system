# Fretebras Icons

A comprehensive icon library for the Fretebras Design System, automatically generated from Figma.

## Features

- 🎨 Automatically syncs with Figma
- ⚡ Optimized SVG icons
- 🏗️ React components with TypeScript support
- 🎨 CSS classes for easy styling
- 📦 Tree-shakeable imports
- 📝 Auto-generated documentation

## Installation

```bash
npm install @fretebras/icon-package
# or
yarn add @fretebras/icon-package
# or
pnpm add @fretebras/icon-package
```

## Usage

### React Components

```jsx
import { SearchIcon, HomeIcon } from '@fretebras/icon-package';

function App() {
  return (
    <div>
      <h1>My App</h1>
      <SearchIcon variant="outline" size="24px" color="#333" />
      <HomeIcon variant="filled" size="32px" className="my-icon" />
    </div>
  );
}
```

### Available Props

| Prop      | Type                     | Default       | Description                          |
|-----------|--------------------------|---------------|--------------------------------------|
| size      | string \| number       | '24px'       | Size of the icon                     |
| variant   | 'outline' \| 'filled' | 'outline'   | Variant of the icon                 |
| color     | string                  | 'currentColor'| Color of the icon                    |
| className | string                  | ''           | Additional CSS class                 |
| ...props  | SVGProps<SVGSVGElement> | -             | All standard SVG element properties  |

### CSS Usage

Import the generated CSS in your application:

```js
import '@fretebras/icon-package/assets/icons.css';
```

Then use the icon classes in your HTML:

```html
<span class="icon icon-search"></span>
```

## Development

### Prerequisites

- Node.js 16+
- npm 7+ or yarn 1.22+ or pnpm 6+
- Figma Personal Access Token (with `file_read` scope)


### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   # or
   pnpm install
   ```
3. Create a `.env` file in the root directory with your Figma access token:
   ```
   FIGMA_ACCESS_TOKEN=your_figma_access_token_here
   ```
   > **Note:** Get your token from [Figma Account Settings > Access Tokens](https://www.figma.com/settings/account)

### Generating Icons

To generate icons from Figma:

```bash
npm run generate
```

This will:
1. Extract icons from the configured Figma file
2. Generate React components
3. Create CSS classes
4. Generate documentation
5. Build the package

### Available Scripts

- `npm run generate` - Generate all assets (icons, components, CSS, docs)
- `npm run generate:icons` - Extract icons from Figma
- `npm run generate:components` - Generate React components from icons
- `npm run generate:css` - Generate CSS file
- `npm run generate:docs` - Generate documentation
- `npm run build` - Build the package
- `npm run clean` - Clean generated files

## Contributing

1. Make your changes to the Figma file
2. Run the generation script:
   ```bash
   npm run generate
   ```
3. Commit the changes to the generated files
4. Open a pull request

## License

MIT
   export FIGMA_ACCESS_TOKEN=your_access_token_here
   ```

### Generating Icons

To generate icons from the Figma file:

```bash
npm run generate-icons
# or
yarn generate-icons
```

This will:
1. Fetch the latest icons from Figma
2. Download SVGs to the `assets/icons` directory
3. Generate React components in `src/components/icons`
4. Create a CSS file with icon styles
5. Generate documentation in `ICON_DOCS.md`

### Building the Package

To build the package for distribution:

```bash
npm run build
# or
yarn build
```

This will create:
- CommonJS modules in `dist`
- ES modules in `dist/esm`
- TypeScript type definitions

## License

MIT
