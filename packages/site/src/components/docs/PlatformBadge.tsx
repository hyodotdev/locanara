type Platform = "ios" | "android" | "web" | "react-native" | "flutter";

interface PlatformBadgeProps {
  platforms: Platform[];
  size?: "sm" | "md";
}

const platformInfo: Record<
  Platform,
  { label: string; bg: string; text: string; darkBg: string; darkText: string }
> = {
  ios: {
    label: "iOS",
    bg: "bg-blue-500/12",
    text: "text-[#007aff]",
    darkBg: "dark:bg-blue-400/20",
    darkText: "dark:text-[#0a84ff]",
  },
  android: {
    label: "Android",
    bg: "bg-green-500/12",
    text: "text-[#3ddc84]",
    darkBg: "dark:bg-green-400/20",
    darkText: "dark:text-[#3ddc84]",
  },
  web: {
    label: "Web",
    bg: "bg-blue-400/12",
    text: "text-[#4285f4]",
    darkBg: "dark:bg-blue-300/20",
    darkText: "dark:text-[#8ab4f8]",
  },
  "react-native": {
    label: "React Native",
    bg: "bg-cyan-400/12",
    text: "text-[#61dafb]",
    darkBg: "dark:bg-cyan-400/20",
    darkText: "dark:text-[#61dafb]",
  },
  flutter: {
    label: "Flutter",
    bg: "bg-blue-600/12",
    text: "text-[#02569b]",
    darkBg: "dark:bg-blue-400/20",
    darkText: "dark:text-[#54c5f8]",
  },
};

export function PlatformBadge({ platforms, size = "md" }: PlatformBadgeProps) {
  const filteredPlatforms = platforms;

  return (
    <div className="flex flex-wrap gap-2">
      {filteredPlatforms.map((platform) => {
        const info = platformInfo[platform];
        return (
          <span
            key={platform}
            className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wide ${info.bg} ${info.text} ${info.darkBg} ${info.darkText} ${
              size === "sm"
                ? "px-2 py-0.5 text-[0.65rem]"
                : "px-2.5 py-1 text-xs"
            }`}
          >
            {info.label}
          </span>
        );
      })}
    </div>
  );
}

export default PlatformBadge;
