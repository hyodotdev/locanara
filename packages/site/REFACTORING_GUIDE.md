# Navigation Refactoring Guide

## Problem

Navigation structure is hardcoded in `src/pages/docs/index.tsx`, violating SSOT principle and making maintenance difficult.

## Solution

Created `src/lib/navigation.ts` as Single Source of Truth for all navigation items.

## Before (Hardcoded)

```tsx
<MenuDropdown
  title="APIs"
  titleTo="/docs/apis"
  items={[
    { to: "/docs/apis/get-device-capability", label: "getDeviceCapability" },
    { to: "/docs/apis/chain", label: "Chain" },
    // ... hardcoded items
  ]}
  onItemClick={closeSidebar}
  isExpanded={expandedReference === "apis"}
  onToggle={() => handleReferenceToggle("apis")}
/>
```

## After (Config-driven)

```tsx
import {
  REFERENCE_NAV,
  TUTORIAL_NAV,
  SIMPLE_NAV_LINKS,
} from "../../lib/navigation";

// In component:
{
  REFERENCE_NAV.map((section) => (
    <MenuDropdown
      key={section.title}
      title={section.title}
      titleTo={section.titleTo}
      items={section.items}
      onItemClick={closeSidebar}
      isExpanded={expandedReference === section.title.toLowerCase()}
      onToggle={() => handleReferenceToggle(section.title.toLowerCase())}
    />
  ));
}
```

## Benefits

### ✅ SSOT Compliance

- All navigation items defined in one place
- Easy to add/remove/update items
- No duplication

### ✅ Type Safety

- Full TypeScript support
- Compile-time validation
- Autocomplete in IDE

### ✅ Maintainability

- Changes in one place affect entire app
- Easy to refactor route structure
- Clear separation of concerns

### ✅ Scalability

- Easy to add new sections
- Supports dynamic navigation
- Can extend for i18n, permissions, etc.

## Migration Steps

1. **Import config**:

   ```tsx
   import { REFERENCE_NAV, TUTORIAL_NAV } from "../../lib/navigation";
   ```

2. **Replace Reference section**:

   ```tsx
   <h3 style={{ marginTop: "2rem" }}>Reference</h3>
   <ul>
     {REFERENCE_NAV.map((section) => (
       <MenuDropdown
         key={section.title}
         title={section.title}
         titleTo={section.titleTo}
         items={section.items}
         onItemClick={closeSidebar}
         isExpanded={expandedReference === section.title.toLowerCase()}
         onToggle={() => handleReferenceToggle(section.title.toLowerCase())}
       />
     ))}
     {SIMPLE_NAV_LINKS.map((link) => (
       <li key={link.to}>
         <NavLink
           to={link.to}
           className={({ isActive }) => (isActive ? "active" : "")}
           onClick={closeSidebar}
         >
           {link.label}
         </NavLink>
       </li>
     ))}
   </ul>
   ```

3. **Replace Tutorial section**:
   ```tsx
   <h3 style={{ marginTop: "2rem" }}>Tutorials</h3>
   <ul>
     {TUTORIAL_NAV.map((section) => (
       <MenuDropdown
         key={section.title}
         title={section.title}
         titleTo={section.titleTo}
         items={section.items}
         onItemClick={closeSidebar}
         isExpanded={expandedTutorial === section.title.toLowerCase().replace(' ', '-')}
         onToggle={() => handleTutorialToggle(section.title.toLowerCase().replace(' ', '-'))}
       />
     ))}
   </ul>
   ```

## Future Enhancements

### Dynamic Navigation

```tsx
// navigation.ts
export const getNavigationForUser = (userRole: string) => {
  return REFERENCE_NAV.filter((section) =>
    hasPermission(userRole, section.title)
  );
};
```

### Internationalization

```tsx
// navigation.ts
export const getLocalizedNav = (locale: string) => {
  return REFERENCE_NAV.map((section) => ({
    ...section,
    title: t(section.title, { locale }),
    items: section.items.map((item) => ({
      ...item,
      label: t(item.label, { locale }),
    })),
  }));
};
```

### Search Integration

```tsx
// All nav items flattened for search
export const getAllNavItems = () => [
  ...REFERENCE_NAV.flatMap((s) => s.items),
  ...TUTORIAL_NAV.flatMap((s) => s.items),
  ...SIMPLE_NAV_LINKS,
];
```

## Testing

```tsx
import { REFERENCE_NAV, TUTORIAL_NAV } from "../lib/navigation";

describe("Navigation Config", () => {
  it("should have valid routes", () => {
    const allItems = [...REFERENCE_NAV, ...TUTORIAL_NAV].flatMap(
      (s) => s.items
    );
    allItems.forEach((item) => {
      expect(item.to).toMatch(/^\/docs\//);
    });
  });

  it("should have unique labels", () => {
    const labels = [...REFERENCE_NAV, ...TUTORIAL_NAV]
      .flatMap((s) => s.items)
      .map((i) => i.label);
    const unique = new Set(labels);
    expect(labels.length).toBe(unique.size);
  });
});
```
