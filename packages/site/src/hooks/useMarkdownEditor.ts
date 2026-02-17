import { useState, useCallback, useRef, type RefObject } from "react";

export type MarkdownFormat =
  | "bold"
  | "italic"
  | "link"
  | "image"
  | "list"
  | "ordered-list"
  | "code"
  | "quote"
  | "heading";

export interface UseMarkdownEditorOptions {
  initialValue?: string;
  onImageUpload?: () => void;
}

export interface UseMarkdownEditorReturn {
  content: string;
  setContent: (content: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  insertAtCursor: (text: string) => void;
  applyFormat: (format: MarkdownFormat) => void;
  handlePaste: (
    e: React.ClipboardEvent,
    options?: {
      onImage?: (file: File) => Promise<string | null>;
      onUrl?: (url: string, selectedText: string) => string;
    }
  ) => Promise<boolean>;
  handleDrop: (
    e: React.DragEvent,
    onFile?: (file: File) => Promise<string | null>
  ) => Promise<void>;
  handleDragOver: (e: React.DragEvent) => void;
  getSelectedText: () => string;
  getCursorPosition: () => { start: number; end: number };
  setCursorPosition: (start: number, end?: number) => void;
}

export function useMarkdownEditor(
  options: UseMarkdownEditorOptions = {}
): UseMarkdownEditorReturn {
  const { initialValue = "", onImageUpload } = options;

  const [content, setContent] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getSelectedText = useCallback((): string => {
    const textarea = textareaRef.current;
    if (!textarea) return "";
    return content.substring(textarea.selectionStart, textarea.selectionEnd);
  }, [content]);

  const getCursorPosition = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return { start: 0, end: 0 };
    return { start: textarea.selectionStart, end: textarea.selectionEnd };
  }, []);

  const setCursorPosition = useCallback((start: number, end?: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start;
      textarea.selectionEnd = end ?? start;
    }, 0);
  }, []);

  const insertAtCursor = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        setContent((prev) => prev + text);
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newContent =
        content.substring(0, start) + text + content.substring(end);
      setContent(newContent);

      setCursorPosition(start + text.length);
    },
    [content, setCursorPosition]
  );

  const applyFormat = useCallback(
    (format: MarkdownFormat) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);

      // Find the start of the current line
      const lineStart = content.lastIndexOf("\n", start - 1) + 1;
      const textBeforeCursor = content.substring(lineStart, start);
      const isAtLineStart = textBeforeCursor.trim() === "";

      let formattedText = "";
      let newCursorPos = 0;

      switch (format) {
        case "bold":
          formattedText = `**${selectedText}**`;
          newCursorPos = selectedText
            ? start + formattedText.length
            : start + 2;
          break;
        case "italic":
          formattedText = `*${selectedText}*`;
          newCursorPos = selectedText
            ? start + formattedText.length
            : start + 1;
          break;
        case "link":
          formattedText = `[${selectedText || "link text"}](url)`;
          newCursorPos = selectedText
            ? start + formattedText.length
            : start + 1;
          break;
        case "image":
          onImageUpload?.();
          return;
        case "list":
          if (isAtLineStart) {
            formattedText = `- ${selectedText}`;
          } else {
            formattedText = `\n- ${selectedText}`;
          }
          newCursorPos = start + formattedText.length;
          break;
        case "ordered-list":
          if (isAtLineStart) {
            formattedText = `1. ${selectedText}`;
          } else {
            formattedText = `\n1. ${selectedText}`;
          }
          newCursorPos = start + formattedText.length;
          break;
        case "code":
          if (selectedText.includes("\n")) {
            formattedText = `\`\`\`\n${selectedText}\n\`\`\``;
          } else {
            formattedText = `\`${selectedText}\``;
          }
          newCursorPos = selectedText
            ? start + formattedText.length
            : start + 1;
          break;
        case "quote":
          if (isAtLineStart) {
            formattedText = `> ${selectedText}`;
          } else {
            formattedText = `\n> ${selectedText}`;
          }
          newCursorPos = start + formattedText.length;
          break;
        case "heading":
          if (isAtLineStart) {
            formattedText = `## ${selectedText}`;
          } else {
            formattedText = `\n## ${selectedText}`;
          }
          newCursorPos = start + formattedText.length;
          break;
        default:
          return;
      }

      const newContent =
        content.substring(0, start) + formattedText + content.substring(end);
      setContent(newContent);
      setCursorPosition(newCursorPos);
    },
    [content, onImageUpload, setCursorPosition]
  );

  const isUrl = (str: string): boolean => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const handlePaste = useCallback(
    async (
      e: React.ClipboardEvent,
      options?: {
        onImage?: (file: File) => Promise<string | null>;
        onUrl?: (url: string, selectedText: string) => string;
      }
    ): Promise<boolean> => {
      const { onImage, onUrl } = options || {};
      const items = e.clipboardData.items;

      // Check for image in clipboard
      if (onImage) {
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
              const url = await onImage(file);
              if (url) {
                insertAtCursor(`![image](${url})\n`);
                return true;
              }
            }
            return false;
          }
        }
      }

      // Check for URL in clipboard
      const text = e.clipboardData.getData("text");
      if (text && isUrl(text.trim())) {
        e.preventDefault();
        const selectedText = getSelectedText();

        if (onUrl) {
          const formatted = onUrl(text.trim(), selectedText);
          if (selectedText) {
            const { start, end } = getCursorPosition();
            const newContent =
              content.substring(0, start) + formatted + content.substring(end);
            setContent(newContent);
            setCursorPosition(start + formatted.length);
          } else {
            insertAtCursor(formatted);
          }
        } else {
          // Default URL handling
          if (selectedText) {
            const { start, end } = getCursorPosition();
            const linkText = `[${selectedText}](${text.trim()})`;
            const newContent =
              content.substring(0, start) + linkText + content.substring(end);
            setContent(newContent);
            setCursorPosition(start + linkText.length);
          } else {
            const linkText = `[](${text.trim()})`;
            insertAtCursor(linkText);
            // Move cursor between brackets
            const textarea = textareaRef.current;
            if (textarea) {
              const pos = textarea.selectionStart - text.trim().length - 3;
              setCursorPosition(pos);
            }
          }
        }
        return true;
      }

      return false;
    },
    [
      content,
      insertAtCursor,
      getSelectedText,
      getCursorPosition,
      setCursorPosition,
    ]
  );

  const handleDrop = useCallback(
    async (
      e: React.DragEvent,
      onFile?: (file: File) => Promise<string | null>
    ) => {
      e.preventDefault();
      if (!onFile) return;

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        const url = await onFile(file);
        if (url) {
          insertAtCursor(`![${file.name}](${url})\n`);
        }
      }
    },
    [insertAtCursor]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return {
    content,
    setContent,
    textareaRef,
    insertAtCursor,
    applyFormat,
    handlePaste,
    handleDrop,
    handleDragOver,
    getSelectedText,
    getCursorPosition,
    setCursorPosition,
  };
}
