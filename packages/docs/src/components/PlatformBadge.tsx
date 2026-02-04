type Platform = "ios" | "android" | "web" | "react-native" | "flutter";

interface PlatformBadgeProps {
  platforms: Platform[];
  size?: "sm" | "md";
}

const platformInfo: Record<
  Platform,
  { label: string; color: string; darkColor: string }
> = {
  ios: { label: "iOS", color: "#007aff", darkColor: "#0a84ff" },
  android: { label: "Android", color: "#3ddc84", darkColor: "#3ddc84" },
  web: { label: "Web", color: "#4285f4", darkColor: "#8ab4f8" },
  "react-native": {
    label: "React Native",
    color: "#61dafb",
    darkColor: "#61dafb",
  },
  flutter: { label: "Flutter", color: "#02569b", darkColor: "#54c5f8" },
};

const isPro = () => import.meta.env.VITE_DOCS_TIER === "pro";

export function PlatformBadge({ platforms, size = "md" }: PlatformBadgeProps) {
  // Filter out "web" platform in Community tier
  const filteredPlatforms = isPro()
    ? platforms
    : platforms.filter((p) => p !== "web");

  return (
    <div className={`platform-badges platform-badges-${size}`}>
      {filteredPlatforms.map((platform) => (
        <span
          key={platform}
          className={`platform-badge platform-badge-${platform}`}
          style={
            {
              "--platform-color": platformInfo[platform].color,
              "--platform-dark-color": platformInfo[platform].darkColor,
            } as React.CSSProperties
          }
        >
          {platformInfo[platform].label}
        </span>
      ))}
    </div>
  );
}

export default PlatformBadge;
