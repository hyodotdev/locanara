# /docs

Manages and updates the project documentation website.

Validation, scan, and status requests are read-only. Edit pages or styles only
when the user asks for a documentation change.

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
/docs build and verify
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
- **Tailwind CSS** plus the existing shared styles in `src/index.css` and
  `src/styles/`
- **Convex** for backend (auth, database)
- **Vite 6** for build
- **Firebase Hosting** for deployment
- **lucide-react** for icons (NOT react-icons)

## Instructions

When this command is executed, automatically perform the following:

### 1. Analyze Request

Classify the user's request into one of:

- **Document Validation**: Scan all pages and find issues
- **Add Page**: Create a requested missing page
- **API Documentation**: Derive shared types from GraphQL and behavior from the
  current implementation
- **Style Fix**: Update Tailwind styles
- **Build Verification**: Typecheck, lint, test, and build locally

### 2. Key File Locations

#### Content

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
4. Use the `doc-page` CSS class wrapper and import components from
   `../../../components/docs/` when the page lives under `src/pages/docs/apis/`

### 4. Build and Verification

```bash
# Local development
cd packages/site
bun run dev

# Verify independently so one failure does not hide the remaining results
bun run typecheck
bun run lint
bun run format:check
bun run test
bun run build
```

AI agents must never run `firebase deploy`, trigger the deploy workflow, or
publish a preview. Deployment is maintainer-only and requires an explicit
release workflow outside `/docs`.

### 5. Validation Items

#### Docs Pages

- [ ] Shared generated types match the GraphQL schema
- [ ] Behavioral claims and code samples match the current implementation
- [ ] All parameters are documented
- [ ] Relevant Apple, Android, Web, and wrapper examples exist
- [ ] Error cases are documented

#### Styles

- [ ] Test both light/dark mode
- [ ] Test responsive layout
- [ ] Check code block readability

## Key Principles

1. **Use the Right Truth**: GraphQL controls shared generated types; platform behavior comes from the current implementation
2. **Maintain Consistency**: Unify styles and format across all pages
3. **Examples Required**: Include every platform on which the API is actually available; do not invent parity
4. **Dark Mode Support**: Use Tailwind `dark:` prefix
5. **Responsive Required**: Test mobile view
6. **Follow Existing Styles**: Prefer Tailwind utilities and reuse the current
   shared CSS/tokens; inspect the implementation before adding a new stylesheet.
7. **No Deployment**: `/docs` may build and verify, but never deploy or trigger release automation.

## Reference Documents

- `CLAUDE.md` - Project conventions
- `packages/gql/src/` - GraphQL schema (doc generation source)
- `locanara-versions.json` - Version information
