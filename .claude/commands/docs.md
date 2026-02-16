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
/docs fix styles
/docs build and deploy
```

## Documentation Website Structure

The docs are part of the unified site at `packages/site/`.

```text
packages/site/
├── src/
│   ├── pages/
│   │   ├── home/Home.tsx          # Landing page
│   │   ├── community/             # Community pages
│   │   ├── feature-requests/      # Feature requests
│   │   ├── docs/                  # Documentation pages
│   │   │   ├── index.tsx          # Docs router + sidebar
│   │   │   ├── introduction.tsx
│   │   │   ├── why-locanara.tsx
│   │   │   ├── apis/             # Framework API reference
│   │   │   │   ├── model.tsx
│   │   │   │   ├── chain.tsx
│   │   │   │   ├── pipeline.tsx
│   │   │   │   ├── memory.tsx
│   │   │   │   ├── guardrail.tsx
│   │   │   │   ├── session.tsx
│   │   │   │   ├── agent.tsx
│   │   │   │   └── get-device-capability.tsx
│   │   │   ├── utils/            # Utility API reference
│   │   │   │   ├── summarize.tsx
│   │   │   │   ├── classify.tsx
│   │   │   │   └── ...
│   │   │   ├── types/            # Type definitions
│   │   │   ├── tutorials/        # Platform tutorials
│   │   │   └── libraries/        # Library docs (Expo, etc.)
│   │   ├── blog/index.tsx         # Blog
│   │   └── versions.tsx           # Version info
│   ├── components/
│   │   ├── docs/                  # Doc-specific components
│   │   │   ├── CodeBlock.tsx
│   │   │   ├── LanguageTabs.tsx
│   │   │   ├── PlatformTabs.tsx
│   │   │   ├── MenuDropdown.tsx
│   │   │   ├── SearchModal.tsx
│   │   │   ├── Callout.tsx
│   │   │   ├── TLDRBox.tsx
│   │   │   └── ...
│   │   ├── Navigation.tsx         # Site-wide navigation
│   │   ├── Footer.tsx
│   │   └── SEO.tsx
│   ├── styles/
│   │   ├── docs.css               # Docs sidebar & layout
│   │   └── code.css               # Syntax highlighting
│   └── lib/
│       ├── config.ts
│       ├── signals.ts
│       └── versioning.ts
├── convex/                        # Convex backend
├── tailwind.config.js
├── firebase.json
└── package.json
```

## Tech Stack

- **React 19** + TypeScript
- **Tailwind CSS** for styling (NOT CSS modules or CSS variables)
- **Convex** for backend (auth, database)
- **Vite 6** for build
- **Firebase Hosting** for deployment
- **lucide-react** for icons (NOT react-icons)

## Instructions

When this command is executed, automatically perform the following:

### 1. Analyze Request

Classify the user's request into one of:

- **Document Validation**: Scan all pages and find issues
- **Add Page**: Auto-generate missing pages
- **API Doc Generation**: Auto-generate from GraphQL schema
- **Style Fix**: Update Tailwind styles
- **Build/Deploy**: Build docs and deploy to Firebase

### 2. Key File Locations

#### Docs Pages

- **Sidebar + routing**: `src/pages/docs/index.tsx`
- **API pages**: `src/pages/docs/apis/*.tsx`
- **Utility pages**: `src/pages/docs/utils/*.tsx`
- **Tutorial pages**: `src/pages/docs/tutorials/*.tsx`
- **Type pages**: `src/pages/docs/types/*.tsx`

#### Styling

- **Docs layout (sidebar, content area)**: `src/styles/docs.css`
- **Code syntax highlighting**: `src/styles/code.css`
- **Everything else**: Tailwind utility classes inline

#### Version Management

- **locanara-versions.json** (site root): Version display
- **locanara-versions.json** (monorepo root): Source of truth

### 3. How to Add New API Page

1. Create new file in `src/pages/docs/apis/`
2. Add route in `src/pages/docs/index.tsx` (import + Route)
3. Add to sidebar menu in `src/pages/docs/index.tsx` (MenuDropdown items)
4. Use `doc-page` CSS class wrapper and import components from `../../components/docs/`

### 4. Build and Deploy

```bash
# Local development
cd packages/site
bunx convex dev & bun dev

# Build
bun run build

# Auto deploy: push to main triggers .github/workflows/deploy-site.yml
```

### 5. Validation Items

#### Docs Pages

- [ ] Matches GraphQL schema
- [ ] All parameters are documented
- [ ] iOS/Android example code exists
- [ ] Error cases are documented

#### Styles

- [ ] Test both light/dark mode
- [ ] Test responsive layout
- [ ] Check code block readability

## Key Principles

1. **GraphQL is Truth**: API docs are always generated from GraphQL schema
2. **Maintain Consistency**: Unify styles and format across all pages
3. **Examples Required**: All APIs include Swift + Kotlin examples
4. **Dark Mode Support**: Use Tailwind `dark:` prefix
5. **Responsive Required**: Test mobile view
6. **Tailwind Only**: Never add new CSS files. Use Tailwind classes inline.

## Reference Documents

- `CLAUDE.md` - Project conventions
- `packages/gql/src/` - GraphQL schema (doc generation source)
- `locanara-versions.json` - Version information
