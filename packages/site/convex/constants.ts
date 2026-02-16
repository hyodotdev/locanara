// Post categories for the community forum
export const CATEGORIES = [
  {
    key: "general",
    name: "General",
    description: "General discussions about Locanara and on-device AI",
    icon: "💬",
    color: "text-blue-500",
    wip: false,
  },
  {
    key: "ios",
    name: "iOS",
    description: "iOS native development with Swift and Apple Intelligence",
    icon: "🍎",
    color: "text-gray-500",
    wip: false,
  },
  {
    key: "android",
    name: "Android",
    description: "Android native development with Kotlin and Gemini Nano",
    icon: "🤖",
    color: "text-green-500",
    wip: false,
  },
  {
    key: "react-native",
    name: "React Native",
    description: "React Native SDK using Nitro Modules",
    icon: "⚛️",
    color: "text-cyan-500",
    wip: true,
  },
  {
    key: "expo",
    name: "Expo",
    description: "Expo SDK for managed workflow integration",
    icon: "📱",
    color: "text-violet-500",
    wip: true,
  },
  {
    key: "flutter",
    name: "Flutter",
    description: "Flutter SDK for cross-platform development",
    icon: "🦋",
    color: "text-sky-500",
    wip: true,
  },
  {
    key: "kmp",
    name: "KMP",
    description: "Kotlin Multiplatform for shared business logic",
    icon: "🔷",
    color: "text-purple-500",
    wip: true,
  },
  {
    key: "showcase",
    name: "Showcase",
    description: "Share your projects built with Locanara",
    icon: "🎨",
    color: "text-pink-500",
    wip: false,
  },
  {
    key: "help",
    name: "Help",
    description: "Get help from the community",
    icon: "❓",
    color: "text-amber-500",
    wip: false,
  },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export const getCategoryByKey = (key: string) =>
  CATEGORIES.find((c) => c.key === key);

export const getCategoryName = (key: string) =>
  getCategoryByKey(key)?.name ?? key;
