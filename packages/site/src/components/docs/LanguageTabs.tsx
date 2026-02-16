import { useState, type ReactNode } from "react";

type Language = "typescript" | "swift" | "kotlin" | "dart";

interface LanguageTabsProps {
  children: {
    typescript?: ReactNode;
    swift?: ReactNode;
    kotlin?: ReactNode;
    dart?: ReactNode;
  };
}

const LANGUAGE_LABELS: Record<Language, string> = {
  typescript: "TypeScript",
  swift: "Swift",
  kotlin: "Kotlin",
  dart: "Dart",
};

function LanguageTabs({ children }: LanguageTabsProps) {
  const [activeTab, setActiveTab] = useState<Language>("typescript");

  const availableLanguages = (Object.keys(children) as Language[]).filter(
    (lang) => children[lang] !== undefined
  );

  return (
    <div className="my-4">
      <div className="flex border-b border-primary/10 dark:border-white/10">
        {availableLanguages.map((lang) => (
          <button
            key={lang}
            className={`px-4 py-2 text-sm font-medium relative transition-colors ${
              activeTab === lang
                ? "text-primary dark:text-text-dark-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary dark:after:bg-text-dark-primary"
                : "text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary"
            }`}
            onClick={() => setActiveTab(lang)}
          >
            {LANGUAGE_LABELS[lang]}
          </button>
        ))}
      </div>
      <div className="mt-0">{children[activeTab]}</div>
    </div>
  );
}

export default LanguageTabs;
