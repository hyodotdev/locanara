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
    <nav className="table-of-contents">
      <div className="toc-title">On this page</div>
      <ul className="toc-list">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={`toc-item toc-level-${heading.level} ${activeId === heading.id ? "active" : ""}`}
          >
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default TableOfContents;
