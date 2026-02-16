import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface User {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

interface MentionAutocompleteProps {
  query: string;
  position: { top: number; left: number } | null;
  onSelect: (username: string) => void;
  onClose: () => void;
}

export function MentionAutocomplete({
  query,
  position,
  onSelect,
  onClose,
}: MentionAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchResults = useQuery(
    api.users.query.searchUsers,
    query.length >= 1 ? { query } : "skip"
  );

  const users = (searchResults ?? []) as User[];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!position || users.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % users.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
          break;
        case "Enter":
        case "Tab":
          e.preventDefault();
          if (users[selectedIndex]) {
            onSelect(users[selectedIndex].username);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [position, users, selectedIndex, onSelect, onClose]);

  if (!position || users.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute z-50 w-64 max-h-48 overflow-y-auto bg-background-primary dark:bg-background-dark border border-primary/10 dark:border-white/10 rounded-lg shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      {users.map((user, index) => (
        <button
          key={user.userId}
          className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-primary/5 dark:hover:bg-white/5 ${
            index === selectedIndex ? "bg-primary/5 dark:bg-white/5" : ""
          }`}
          onClick={() => onSelect(user.username)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.displayName}</p>
            <p className="text-xs text-text-secondary dark:text-text-dark-secondary truncate">
              @{user.username}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

// Hook to manage mention autocomplete state
export function useMentionAutocomplete(
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  value: string,
  onChange: (value: string) => void
) {
  const [mentionState, setMentionState] = useState<{
    isActive: boolean;
    query: string;
    startIndex: number;
    position: { top: number; left: number } | null;
  }>({
    isActive: false,
    query: "",
    startIndex: 0,
    position: null,
  });

  const checkForMention = (cursorPos: number, text: string) => {
    // Find the start of the current word
    let start = cursorPos - 1;
    while (start >= 0 && !/\s/.test(text[start])) {
      start--;
    }
    start++;

    const word = text.substring(start, cursorPos);

    if (word.startsWith("@") && word.length >= 1) {
      const query = word.substring(1);
      const textarea = textareaRef.current;

      if (textarea) {
        // Calculate position for dropdown
        const lineHeight = 24;
        const lines = text.substring(0, cursorPos).split("\n");
        const currentLine = lines.length - 1;
        const rect = textarea.getBoundingClientRect();
        const scrollTop = textarea.scrollTop;

        setMentionState({
          isActive: true,
          query,
          startIndex: start,
          position: {
            top: rect.top + (currentLine + 1) * lineHeight - scrollTop + 8,
            left: rect.left + 16,
          },
        });
      }
    } else {
      setMentionState((prev) => ({ ...prev, isActive: false, query: "" }));
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    checkForMention(cursorPos, value);
  };

  const handleSelect = (username: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const beforeMention = value.substring(0, mentionState.startIndex);
    const afterMention = value.substring(textarea.selectionStart);
    const newValue = `${beforeMention}@${username} ${afterMention}`;

    onChange(newValue);
    setMentionState({
      isActive: false,
      query: "",
      startIndex: 0,
      position: null,
    });

    // Set cursor position after the mention
    setTimeout(() => {
      const newPos = mentionState.startIndex + username.length + 2;
      textarea.focus();
      textarea.selectionStart = newPos;
      textarea.selectionEnd = newPos;
    }, 0);
  };

  const handleClose = () => {
    setMentionState({
      isActive: false,
      query: "",
      startIndex: 0,
      position: null,
    });
  };

  return {
    mentionState,
    handleInput,
    handleSelect,
    handleClose,
  };
}
