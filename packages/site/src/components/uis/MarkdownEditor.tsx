import {
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import {
  Bold,
  Italic,
  Link2,
  Image,
  List,
  ListOrdered,
  Eye,
  Code,
  Quote,
  Heading2,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MarkdownFormat } from "../../hooks/useMarkdownEditor";
import { MentionAutocomplete } from "./MentionAutocomplete";

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  isUploading?: boolean;
  showPreview?: boolean;
  previewMode?: "split" | "toggle";
  isPreviewActive?: boolean;
  onPreviewToggle?: (active: boolean) => void;
  onFormat?: (format: MarkdownFormat) => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  toolbarItems?: MarkdownFormat[];
  className?: string;
  textareaClassName?: string;
  enableMentions?: boolean;
}

export interface MarkdownEditorRef {
  focus: () => void;
  getTextarea: () => HTMLTextAreaElement | null;
  insertAtCursor: (text: string) => void;
}

const defaultToolbarItems: MarkdownFormat[] = [
  "bold",
  "italic",
  "link",
  "image",
  "list",
  "ordered-list",
];

const toolbarIcons: Record<MarkdownFormat, React.ReactNode> = {
  bold: <Bold className="w-4 h-4" />,
  italic: <Italic className="w-4 h-4" />,
  link: <Link2 className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  list: <List className="w-4 h-4" />,
  "ordered-list": <ListOrdered className="w-4 h-4" />,
  code: <Code className="w-4 h-4" />,
  quote: <Quote className="w-4 h-4" />,
  heading: <Heading2 className="w-4 h-4" />,
};

const toolbarTitles: Record<MarkdownFormat, string> = {
  bold: "Bold",
  italic: "Italic",
  link: "Link",
  image: "Upload Image",
  list: "Bullet List",
  "ordered-list": "Numbered List",
  code: "Code",
  quote: "Quote",
  heading: "Heading",
};

export const MarkdownEditor = forwardRef<
  MarkdownEditorRef,
  MarkdownEditorProps
>(
  (
    {
      value,
      onChange,
      placeholder = "Write your content...",
      minHeight = "300px",
      isUploading = false,
      showPreview = true,
      previewMode = "split",
      isPreviewActive = false,
      onPreviewToggle: _onPreviewToggle,
      onFormat,
      onPaste,
      onDrop,
      onDragOver,
      toolbarItems = defaultToolbarItems,
      className = "",
      textareaClassName = "",
      enableMentions = false,
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);

    // Mention autocomplete state
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

    const checkForMention = useCallback(
      (cursorPos: number, text: string) => {
        if (!enableMentions) return;

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
          const container = editorContainerRef.current;

          if (textarea && container) {
            const containerRect = container.getBoundingClientRect();
            const textareaRect = textarea.getBoundingClientRect();

            // Simple position calculation - show dropdown below cursor line
            const lineHeight = 24;
            const lines = text.substring(0, cursorPos).split("\n");
            const currentLine = lines.length;

            setMentionState({
              isActive: true,
              query,
              startIndex: start,
              position: {
                top:
                  textareaRect.top -
                  containerRect.top +
                  currentLine * lineHeight +
                  8,
                left: 16,
              },
            });
          }
        } else {
          setMentionState((prev) => ({ ...prev, isActive: false, query: "" }));
        }
      },
      [enableMentions]
    );

    const handleMentionSelect = useCallback(
      (username: string) => {
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
      },
      [value, onChange, mentionState.startIndex]
    );

    const handleMentionClose = useCallback(() => {
      setMentionState({
        isActive: false,
        query: "",
        startIndex: 0,
        position: null,
      });
    }, []);

    const handleTextareaChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        if (enableMentions) {
          const cursorPos = e.target.selectionStart;
          checkForMention(cursorPos, newValue);
        }
      },
      [onChange, enableMentions, checkForMention]
    );

    const handleTextareaKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!mentionState.isActive) return;

        if (e.key === "Escape") {
          e.preventDefault();
          handleMentionClose();
        }
      },
      [mentionState.isActive, handleMentionClose]
    );

    const insertAtCursor = useCallback(
      (text: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
          onChange(value + text);
          return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue =
          value.substring(0, start) + text + value.substring(end);
        onChange(newValue);

        setTimeout(() => {
          textarea.focus();
          const newPos = start + text.length;
          textarea.selectionStart = newPos;
          textarea.selectionEnd = newPos;
        }, 0);
      },
      [value, onChange]
    );

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      getTextarea: () => textareaRef.current,
      insertAtCursor,
    }));

    const handleFormat = (format: MarkdownFormat) => {
      onFormat?.(format);
    };

    const renderToolbar = () => (
      <div className="p-2 flex items-center gap-1 min-h-[52px] border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
        {toolbarItems.map((format) => (
          <button
            key={format}
            onClick={() => handleFormat(format)}
            className="p-2 rounded hover:bg-primary/5 dark:hover:bg-white/5 transition-colors"
            title={toolbarTitles[format]}
            disabled={format === "image" && isUploading}
            type="button"
          >
            {format === "image" && isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              toolbarIcons[format]
            )}
          </button>
        ))}
      </div>
    );

    const renderTextarea = () => (
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleTextareaKeyDown}
          onPaste={onPaste}
          onDrop={onDrop}
          onDragOver={onDragOver}
          placeholder={placeholder}
          className={`w-full h-full p-4 border-0 focus:outline-none resize-none bg-background-primary dark:bg-background-dark ${textareaClassName}`}
          style={{ minHeight }}
        />
        {enableMentions && mentionState.isActive && mentionState.position && (
          <MentionAutocomplete
            query={mentionState.query}
            position={mentionState.position}
            onSelect={handleMentionSelect}
            onClose={handleMentionClose}
          />
        )}
      </div>
    );

    const renderPreview = () => (
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-text-secondary dark:text-text-dark-secondary italic">
              Preview will appear here...
            </p>
          )}
        </div>
      </div>
    );

    // Toggle mode (mobile)
    if (previewMode === "toggle") {
      return (
        <div
          ref={editorContainerRef}
          className={`flex flex-col relative ${className}`}
        >
          {!isPreviewActive ? (
            <>
              {renderToolbar()}
              {renderTextarea()}
            </>
          ) : (
            renderPreview()
          )}
        </div>
      );
    }

    // Split mode (desktop)
    return (
      <div ref={editorContainerRef} className={`flex relative ${className}`}>
        {/* Editor Pane */}
        <div className="w-1/2 flex flex-col border-r border-primary/10 dark:border-white/10">
          {renderToolbar()}
          <div className="flex-1 overflow-hidden">{renderTextarea()}</div>
        </div>

        {/* Preview Pane */}
        {showPreview && (
          <div className="w-1/2 flex flex-col">
            <div className="p-2 flex items-center gap-2 min-h-[52px] border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">Preview</span>
            </div>
            {renderPreview()}
          </div>
        )}
      </div>
    );
  }
);

MarkdownEditor.displayName = "MarkdownEditor";
