import { useState, useEffect, useRef, useCallback } from "react";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  selector?: string;
}

export function TableOfContents({
  selector = ".doc-page",
}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const throttleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const container = document.querySelector(selector);
    if (!container) return;

    const elements = container.querySelectorAll("h2[id], h3[id]");
    const items: TOCItem[] = Array.from(elements).map((el) => ({
      id: el.id,
      text: el.textContent?.replace("#", "").trim() || "",
      level: el.tagName === "H2" ? 2 : 3,
    }));

    setHeadings(items);
  }, [selector]);

  const handleScroll = useCallback(() => {
    const headingElements = headings.map((h) => document.getElementById(h.id));
    const scrollPosition = window.scrollY + 100;

    for (let i = headingElements.length - 1; i >= 0; i--) {
      const element = headingElements[i];
      if (element && element.offsetTop <= scrollPosition) {
        setActiveId(headings[i].id);
        return;
      }
    }

    if (headings.length > 0) {
      setActiveId(headings[0].id);
    }
  }, [headings]);

  useEffect(() => {
    const throttledScroll = () => {
      if (throttleTimeoutRef.current) return;

      throttleTimeoutRef.current = setTimeout(() => {
        handleScroll();
        throttleTimeoutRef.current = null;
      }, 100);
    };

    window.addEventListener("scroll", throttledScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", throttledScroll);
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block sticky top-20 w-56 text-sm max-h-[calc(100vh-100px)] overflow-y-auto px-4">
      <div className="text-[0.6875rem] font-semibold uppercase tracking-wider text-text-secondary dark:text-text-dark-secondary mb-3 pl-3">
        On this page
      </div>
      <ul className="list-none m-0 p-0">
        {headings.map((heading) => (
          <li key={heading.id} className="m-0">
            <a
              href={`#${heading.id}`}
              className={`block py-1.5 border-l-2 text-[0.8125rem] leading-snug no-underline transition-all duration-150 ${
                heading.level === 3 ? "pl-6" : "pl-3"
              } ${
                activeId === heading.id
                  ? "text-primary dark:text-text-dark-primary border-l-primary dark:border-l-text-dark-primary bg-blue-500/5 dark:bg-blue-500/10"
                  : "text-text-secondary dark:text-text-dark-secondary border-l-transparent hover:text-text-primary dark:hover:text-text-dark-primary"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default TableOfContents;
