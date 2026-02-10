# /docs

Manages and updates the project documentation website.

## Usage

```text
/docs <request in natural language>
```

## Examples

```text
/docs scan and fix any incorrect documentation
/docs find and add missing documentation
/docs update API documentation
/docs add new Feature page
/docs fix CSS styles
/docs build and deploy
```

## Documentation Website Structure

```text
packages/docs/
├── src/
│   ├── pages/                    # Page components
│   │   ├── home.tsx             # Homepage
│   │   ├── introduction.tsx     # Introduction page
│   │   ├── languages.tsx        # Language support page
│   │   ├── resources.tsx        # Resources page
│   │   └── docs/                # Documentation pages
│   │       ├── index.tsx        # Docs index
│   │       ├── apis/            # Framework API reference
│   │       │   ├── index.tsx
│   │       │   ├── model.tsx
│   │       │   ├── chain.tsx
│   │       │   ├── pipeline.tsx
│   │       │   ├── memory.tsx
│   │       │   ├── guardrail.tsx
│   │       │   ├── session.tsx
│   │       │   ├── agent.tsx
│   │       │   └── get-device-capability.tsx
│   │       ├── utils/           # Utility (feature) API reference
│   │       │   ├── index.tsx
│   │       │   ├── ios.tsx
│   │       │   ├── android.tsx
│   │       │   ├── summarize.tsx
│   │       │   ├── classify.tsx
│   │       │   └── ...
│   │       ├── types/           # Type definitions
│   │       └── updates/         # Update notes
│   │           └── versions.tsx
│   ├── styles/                   # CSS styles
│   │   ├── base.css             # Base styles
│   │   ├── code.css             # Code block styles
│   │   ├── components.css       # Component styles
│   │   ├── dark-mode.css        # Dark mode styles
│   │   ├── documentation.css    # Documentation page styles
│   │   ├── home.css             # Homepage styles
│   │   ├── navigation.css       # Navigation styles
│   │   ├── pages.css            # Page common styles
│   │   ├── responsive.css       # Responsive styles
│   │   └── variables.css        # CSS variables
│   ├── components/              # Reusable components
│   │   ├── CodeBlock.tsx
│   │   ├── Navigation.tsx
│   │   ├── Footer.tsx
│   │   └── ...
│   └── lib/                     # Utilities
│       ├── config.ts
│       └── versioning.ts
├── firebase.json                # Firebase Hosting config
├── .firebaserc                  # Firebase project config
├── package.json
└── vite.config.ts
```

## Instructions

When this command is executed, automatically perform the following:

### 1. Analyze Request

Classify the user's request into one of:

- **Document Validation**: Scan all pages and find issues
- **Add Page**: Auto-generate missing pages
- **API Doc Generation**: Auto-generate from GraphQL schema
- **Style Fix**: Update CSS styles
- **Build/Deploy**: Build docs and deploy to Firebase

### 2. Key File Locations

#### Page Styles

- **Homepage**: `src/styles/home.css`
- **Documentation pages**: `src/styles/documentation.css`
- **General pages**: `src/styles/pages.css` (introduction, languages, resources)
- **Components**: `src/styles/components.css` (Footer, Navigation, etc.)
- **Code blocks**: `src/styles/code.css`

#### Layout Settings

- **content-wrapper**: max-width 1200px (introduction, languages, resources)
- **doc-content**: max-width 900px (documentation pages)
- **benefit-grid**: max-width 900px (homepage cards)
- **specification-grid**: max-width 900px (homepage spec cards)

#### Version Management

- **locanara-versions.json** (root): Overall version management
- **packages/docs/locanara-versions.json**: Docs version (needs sync)

### 3. Style Rules

#### CSS Variable Usage

```css
/* Colors */
var(--text-primary)
var(--text-secondary)
var(--bg-primary)
var(--bg-secondary)
var(--primary-color)
var(--border-color)

/* Spacing */
var(--spacing-sm)
var(--spacing-md)
var(--spacing-lg)
var(--spacing-xl)
var(--spacing-2xl)

/* Fonts */
var(--font-size-xs)
var(--font-size-sm)
var(--font-size-base)
var(--font-size-md)
var(--font-size-lg)
var(--font-size-xl)
var(--font-size-2xl)
```

#### Code Block Colors (Monokai Theme)

```css
/* Dark mode code block */
background: #272822 !important;

/* Light mode code block */
background: #f7f5f2 !important;

/* Inline code (dark mode) */
color: #e6db74; /* Yellow - functions, parameters */
```

### 4. How to Add New API Page

1. Create new file in `src/pages/docs/apis/`
2. Add route to router (`src/App.tsx`)
3. Add to sidebar menu (`src/components/Navigation.tsx`)
4. Add to homepage API table (`src/pages/docs/apis/index.tsx`)

### 5. Build and Deploy

```bash
# Local development
cd packages/docs
bun run dev

# Build
bun run build

# Firebase deploy (manual)
firebase deploy --only hosting

# Auto deploy
# Pushing to main branch triggers GitHub Actions auto-deploy
# .github/workflows/deploy-docs.yml
```

### 6. Validation Items

#### Homepage (home.tsx)

- [ ] Version badge is up to date
- [ ] Feature card links are correct
- [ ] Platform SDK links are correct
- [ ] CTA button links are correct

#### API Pages (apis/)

- [ ] Matches GraphQL schema
- [ ] All parameters are documented
- [ ] iOS/Android example code exists
- [ ] Error cases are documented

#### Styles (styles/)

- [ ] Test both light/dark mode
- [ ] Test responsive layout
- [ ] Check code block readability

### 7. Automatic Workflow

1. **Scan**: Read all page files
2. **Validate**:
   - Compare with GraphQL schema
   - Check link validity
   - Check style consistency
3. **Fix**:
   - Auto-fix incorrect content
   - Auto-generate missing pages
4. **Report**: Summarize completed work

## Key Principles

1. **GraphQL is Truth**: API docs are always generated from GraphQL schema
2. **Maintain Consistency**: Unify styles and format across all pages
3. **Examples Required**: All APIs include Swift + Kotlin examples
4. **Dark Mode Support**: Consider dark mode in all styles
5. **Responsive Required**: Test mobile view

## Reference Documents

- `CLAUDE.md` - Project conventions
- `packages/gql/src/` - GraphQL schema (doc generation source)
- `locanara-versions.json` - Version information
