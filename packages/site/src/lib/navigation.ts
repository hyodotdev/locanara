/**
 * Documentation Navigation Configuration
 * Single Source of Truth for all navigation items
 */

export interface NavItem {
  to: string;
  label: string;
}

export interface NavSection {
  title: string;
  titleTo: string;
  items: NavItem[];
}

/**
 * Reference Section Navigation
 */
export const REFERENCE_NAV: readonly NavSection[] = [
  {
    title: "Types",
    titleTo: "/docs/types",
    items: [
      { to: "/docs/types/ios", label: "iOS Types" },
      { to: "/docs/types/android", label: "Android Types" },
      { to: "/docs/types/web", label: "Web Types" },
    ],
  },
  {
    title: "APIs",
    titleTo: "/docs/apis",
    items: [
      { to: "/docs/apis/get-device-capability", label: "getDeviceCapability" },
      { to: "/docs/apis/chain", label: "Chain" },
      { to: "/docs/apis/pipeline", label: "Pipeline" },
      { to: "/docs/apis/memory", label: "Memory" },
      { to: "/docs/apis/guardrail", label: "Guardrail" },
      { to: "/docs/apis/session", label: "Session" },
      { to: "/docs/apis/agent", label: "Agent" },
      { to: "/docs/apis/model", label: "Model" },
    ],
  },
  {
    title: "Built-in Utils",
    titleTo: "/docs/utils",
    items: [
      { to: "/docs/utils/summarize", label: "summarize" },
      { to: "/docs/utils/classify", label: "classify" },
      { to: "/docs/utils/extract", label: "extract" },
      { to: "/docs/utils/chat", label: "chat" },
      { to: "/docs/utils/translate", label: "translate" },
      { to: "/docs/utils/rewrite", label: "rewrite" },
      { to: "/docs/utils/proofread", label: "proofread" },
      { to: "/docs/utils/describe-image", label: "describeImage" },
      { to: "/docs/utils/ios", label: "iOS Specific" },
      { to: "/docs/utils/android", label: "Android Specific" },
      { to: "/docs/utils/web", label: "Web Specific" },
    ],
  },
] as const;

/**
 * Tutorial Section Navigation
 */
export const TUTORIAL_NAV: readonly NavSection[] = [
  {
    title: "iOS SDK",
    titleTo: "/docs/tutorials/ios",
    items: [
      { to: "/docs/ios-setup", label: "Setup Guide" },
      { to: "/docs/tutorials/ios-summarize", label: "Summarize" },
      { to: "/docs/tutorials/ios-chat", label: "Chat" },
      { to: "/docs/tutorials/ios-rewrite", label: "Rewrite" },
    ],
  },
  {
    title: "Android SDK",
    titleTo: "/docs/tutorials/android",
    items: [
      { to: "/docs/android-setup", label: "Setup Guide" },
      { to: "/docs/tutorials/android-summarize", label: "Summarize" },
      { to: "/docs/tutorials/android-chat", label: "Chat" },
      { to: "/docs/tutorials/android-rewrite", label: "Rewrite" },
    ],
  },
  {
    title: "Web SDK",
    titleTo: "/docs/tutorials/web",
    items: [
      { to: "/docs/web-setup", label: "Setup Guide" },
      { to: "/docs/tutorials/web-summarize", label: "Summarize" },
      { to: "/docs/tutorials/web-chat", label: "Chat" },
      { to: "/docs/tutorials/web-translate", label: "Translate" },
    ],
  },
] as const;

/**
 * Simple Navigation Links (non-dropdown)
 */
export const SIMPLE_NAV_LINKS = [
  { to: "/docs/errors", label: "Errors" },
  { to: "/docs/resources", label: "Resources" },
] as const;

/**
 * Libraries Section Navigation
 */
export const LIBRARIES_NAV: readonly NavSection[] = [
  {
    title: "Third-Party Libraries",
    titleTo: "/docs/libraries",
    items: [
      { to: "/docs/libraries/expo", label: "Expo Module" },
      { to: "/docs/libraries/flutter", label: "Flutter Plugin" },
    ],
  },
] as const;
