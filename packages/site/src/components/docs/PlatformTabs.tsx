import { useState, useEffect, type ReactNode } from "react";

interface PlatformTabsProps {
  children: {
    ios?: ReactNode;
    android?: ReactNode;
  };
}

function PlatformTabs({ children }: PlatformTabsProps) {
  const [activeTab, setActiveTab] = useState<"ios" | "android">(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes("android")) {
      return "android";
    }
    return "ios";
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes("android")) {
        setActiveTab("android");
      } else if (hash.includes("ios")) {
        setActiveTab("ios");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <div className="my-4">
      <div className="flex border-b border-primary/10 dark:border-white/10">
        <button
          className={`px-4 py-2 text-sm font-medium relative transition-colors ${
            activeTab === "ios"
              ? "text-primary dark:text-text-dark-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary dark:after:bg-text-dark-primary"
              : "text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary"
          }`}
          onClick={() => setActiveTab("ios")}
        >
          iOS
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium relative transition-colors ${
            activeTab === "android"
              ? "text-primary dark:text-text-dark-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary dark:after:bg-text-dark-primary"
              : "text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary"
          }`}
          onClick={() => setActiveTab("android")}
        >
          Android
        </button>
      </div>
      <div className="mt-0">
        {activeTab === "ios" && children.ios}
        {activeTab === "android" && children.android}
      </div>
    </div>
  );
}

export default PlatformTabs;
