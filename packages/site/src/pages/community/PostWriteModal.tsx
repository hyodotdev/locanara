import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Bold,
  Italic,
  Link2,
  Image,
  List,
  ListOrdered,
  Eye,
  Edit3,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/uis/Button";
import { CATEGORIES, type CategoryKey } from "../../../convex/constants";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MentionAutocomplete } from "../../components/uis/MentionAutocomplete";
import { Id } from "../../../convex/_generated/dataModel";

export interface EditPostData {
  postId: Id<"posts">;
  title: string;
  content: string;
  category: CategoryKey;
}

interface PostWriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: CategoryKey | null;
  editPost?: EditPostData | null;
}

// Extract hashtags from content
function extractHashtags(content: string): string[] {
  const hashtagRegex = /#([a-zA-Z0-9가-힣_]+)/g;
  const matches = content.match(hashtagRegex);
  if (!matches) return [];
  return [...new Set(matches.map((tag) => tag.slice(1)))];
}

export function PostWriteModal({
  isOpen,
  onClose,
  defaultCategory,
  editPost,
}: PostWriteModalProps) {
  const navigate = useNavigate();
  const createPost = useMutation(api.posts.mutation.createPost);
  const updatePost = useMutation(api.posts.mutation.updatePost);
  const generateUploadUrl = useMutation(api.files.mutation.generateUploadUrl);
  const saveFileMetadata = useMutation(api.files.mutation.saveFileMetadata);
  const linkFilesToPost = useMutation(api.files.mutation.linkFilesToPost);

  const isEditMode = !!editPost;

  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const contentRefDesktop = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CategoryKey>(
    defaultCategory || "general"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasAppeared, setHasAppeared] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);

  // Mention autocomplete state
  const [mentionState, setMentionState] = useState<{
    isActive: boolean;
    query: string;
    startIndex: number;
    position: { top: number; left: number } | null;
    targetRef: "mobile" | "desktop";
  }>({
    isActive: false,
    query: "",
    startIndex: 0,
    position: null,
    targetRef: "desktop",
  });

  // Reset form
  const resetForm = useCallback(() => {
    setTitle("");
    setContent("");
    setCategory(defaultCategory || "general");
    setIsPreviewMode(false);
    setUploadedFileUrls([]);
    setMentionState({
      isActive: false,
      query: "",
      startIndex: 0,
      position: null,
      targetRef: "desktop",
    });
  }, [defaultCategory]);

  // Check for @mention while typing
  const checkForMention = useCallback(
    (cursorPos: number, text: string, isMobile: boolean) => {
      // Find the start of the current word
      let start = cursorPos - 1;
      while (start >= 0 && !/\s/.test(text[start])) {
        start--;
      }
      start++;

      const word = text.substring(start, cursorPos);

      if (word.startsWith("@") && word.length >= 1) {
        const query = word.substring(1);
        const targetRef = isMobile ? contentRef : contentRefDesktop;
        const textarea = targetRef.current;

        if (textarea) {
          const textareaRect = textarea.getBoundingClientRect();
          const modalElement = modalRef.current;
          const modalRect = modalElement?.getBoundingClientRect();

          if (modalRect) {
            // Calculate position relative to the modal
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
                  modalRect.top +
                  currentLine * lineHeight +
                  8,
                left: textareaRect.left - modalRect.left + 16,
              },
              targetRef: isMobile ? "mobile" : "desktop",
            });
          }
        }
      } else {
        setMentionState((prev) => ({ ...prev, isActive: false, query: "" }));
      }
    },
    []
  );

  // Handle mention selection
  const handleMentionSelect = useCallback(
    (username: string) => {
      const targetRef =
        mentionState.targetRef === "mobile" ? contentRef : contentRefDesktop;
      const textarea = targetRef.current;

      const beforeMention = content.substring(0, mentionState.startIndex);
      const afterMention = content.substring(
        textarea?.selectionStart || mentionState.startIndex
      );
      const newContent = `${beforeMention}@${username} ${afterMention}`;

      setContent(newContent);
      setMentionState({
        isActive: false,
        query: "",
        startIndex: 0,
        position: null,
        targetRef: "desktop",
      });

      // Set cursor position after the mention
      setTimeout(() => {
        if (textarea) {
          const newPos = mentionState.startIndex + username.length + 2;
          textarea.focus();
          textarea.selectionStart = newPos;
          textarea.selectionEnd = newPos;
        }
      }, 0);
    },
    [content, mentionState.startIndex, mentionState.targetRef]
  );

  // Close mention autocomplete
  const handleMentionClose = useCallback(() => {
    setMentionState({
      isActive: false,
      query: "",
      startIndex: 0,
      position: null,
      targetRef: "desktop",
    });
  }, []);

  // Handle content change with mention detection
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>, isMobile: boolean) => {
      const newValue = e.target.value;
      setContent(newValue);

      const cursorPos = e.target.selectionStart;
      checkForMention(cursorPos, newValue, isMobile);
    },
    [checkForMention]
  );

  // Handle keyboard events for mention autocomplete
  const handleContentKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!mentionState.isActive) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleMentionClose();
      }
    },
    [mentionState.isActive, handleMentionClose]
  );

  // Upload file to Convex storage
  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        return null;
      }

      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return null;
      }

      setIsUploading(true);
      try {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!response.ok) throw new Error("Upload failed");

        const { storageId } = await response.json();
        const result = await saveFileMetadata({
          storageId,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        });

        setUploadedFileUrls((prev) => [...prev, result.url]);
        return result.url;
      } catch (error) {
        console.error("Upload failed:", error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [generateUploadUrl, saveFileMetadata]
  );

  // Insert text at cursor position
  const insertAtCursor = useCallback(
    (text: string) => {
      const targetRef =
        window.innerWidth >= 768 ? contentRefDesktop : contentRef;
      if (!targetRef.current) {
        setContent((prev) => prev + text);
        return;
      }

      const textarea = targetRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newContent =
        content.substring(0, start) + text + content.substring(end);
      setContent(newContent);

      setTimeout(() => {
        textarea.focus();
        const newPos = start + text.length;
        textarea.selectionStart = newPos;
        textarea.selectionEnd = newPos;
      }, 0);
    },
    [content]
  );

  // Handle file input change
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const url = await uploadFile(file);
      if (url) {
        insertAtCursor(`![${file.name}](${url})\n`);
      }

      // Reset input
      e.target.value = "";
    },
    [uploadFile, insertAtCursor]
  );

  // Check if string is a URL
  const isUrl = (str: string): boolean => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  // Handle paste event
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;

      // Check for image in clipboard
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const url = await uploadFile(file);
            if (url) {
              insertAtCursor(`![image](${url})\n`);
            }
          }
          return;
        }
      }

      // Check for URL in clipboard
      const text = e.clipboardData.getData("text");
      if (text && isUrl(text.trim())) {
        e.preventDefault();
        const targetRef =
          window.innerWidth >= 768 ? contentRefDesktop : contentRef;
        const textarea = targetRef.current;
        const selectedText = textarea
          ? content.substring(textarea.selectionStart, textarea.selectionEnd)
          : "";

        if (selectedText) {
          // Wrap selected text with link
          const linkText = `[${selectedText}](${text.trim()})`;
          const start = textarea!.selectionStart;
          const end = textarea!.selectionEnd;
          const newContent =
            content.substring(0, start) + linkText + content.substring(end);
          setContent(newContent);

          setTimeout(() => {
            textarea!.focus();
            const newPos = start + linkText.length;
            textarea!.selectionStart = newPos;
            textarea!.selectionEnd = newPos;
          }, 0);
        } else {
          // Insert link markdown
          insertAtCursor(`[](${text.trim()})`);
          // Move cursor between brackets
          setTimeout(() => {
            const textarea = (
              window.innerWidth >= 768 ? contentRefDesktop : contentRef
            ).current;
            if (textarea) {
              const pos = textarea.selectionStart - text.trim().length - 3;
              textarea.selectionStart = pos;
              textarea.selectionEnd = pos;
            }
          }, 10);
        }
      }
    },
    [content, uploadFile, insertAtCursor]
  );

  // Handle drop event
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        const url = await uploadFile(file);
        if (url) {
          insertAtCursor(`![${file.name}](${url})\n`);
        }
      }
    },
    [uploadFile, insertAtCursor]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle modal open animation
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setHasAppeared(false);

      requestAnimationFrame(() => {
        setTimeout(() => {
          setHasAppeared(true);
        }, 10);
      });

      const focusTimer = setTimeout(() => {
        titleRef.current?.focus();
      }, 350);

      return () => clearTimeout(focusTimer);
    } else {
      document.body.style.overflow = "";
      setHasAppeared(false);
    }
  }, [isOpen]);

  // Set initial category or load edit data
  useEffect(() => {
    if (isOpen) {
      if (editPost) {
        // Edit mode - load existing post data
        setTitle(editPost.title);
        setContent(editPost.content);
        setCategory(editPost.category);
      } else if (defaultCategory) {
        setCategory(defaultCategory);
      }
    }
  }, [isOpen, defaultCategory, editPost]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    resetForm();
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  }, [onClose, resetForm]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  // Handle formatting - Discourse-style behavior
  const handleFormatting = (format: string) => {
    const targetRef = window.innerWidth >= 768 ? contentRefDesktop : contentRef;
    if (!targetRef.current) return;

    const textarea = targetRef.current;
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
        newCursorPos = selectedText ? start + formattedText.length : start + 2;
        break;
      case "italic":
        formattedText = `*${selectedText}*`;
        newCursorPos = selectedText ? start + formattedText.length : start + 1;
        break;
      case "link":
        formattedText = `[${selectedText || "link text"}](url)`;
        newCursorPos = selectedText ? start + formattedText.length : start + 1;
        break;
      case "image":
        // Trigger file upload instead
        fileInputRef.current?.click();
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
      default:
        return;
    }

    const newContent =
      content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = newCursorPos;
      textarea.selectionEnd = newCursorPos;
    }, 0);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      // Extract tags from content
      const tags = extractHashtags(content);

      if (isEditMode && editPost) {
        // Update existing post
        await updatePost({
          postId: editPost.postId,
          title: title.trim(),
          content: content.trim(),
          category,
          tags,
        });

        resetForm();
        onClose();
        // Stay on the same page, post will refresh via Convex reactivity
      } else {
        // Create new post
        const postId = await createPost({
          title: title.trim(),
          content: content.trim(),
          category,
          tags,
        });

        // Link uploaded files to the post
        if (uploadedFileUrls.length > 0) {
          await linkFilesToPost({ postId, fileUrls: uploadedFileUrls });
        }

        resetForm();
        onClose();
        navigate(`/community/post/${postId}`);
      }
    } catch (error) {
      console.error("Failed to save post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  const currentCategory = CATEGORIES.find((c) => c.key === category);

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center transition-all duration-300 ease-out ${
        isFullscreen ? "items-center" : "items-end"
      } ${
        isOpen && !isClosing
          ? "opacity-100 bg-black/60 backdrop-blur-sm"
          : "opacity-0 bg-black/0 backdrop-blur-none"
      } ${!isOpen && !isClosing ? "pointer-events-none" : ""}`}
    >
      <div
        ref={modalRef}
        className={`flex flex-col overflow-hidden mx-auto bg-background-primary dark:bg-background-dark shadow-2xl ${
          isFullscreen
            ? "w-full h-full rounded-none"
            : "w-[98%] max-w-5xl max-h-[90vh] rounded-t-2xl"
        } transform transition-all duration-300 ease-out ${
          hasAppeared ? "translate-y-0" : "translate-y-full"
        } ${isClosing ? "translate-y-full" : ""}`}
        aria-modal="true"
        role="dialog"
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">
              {isEditMode ? "Edit Post" : "New Post"}
            </h2>
            {currentCategory && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full bg-primary/5 dark:bg-white/5 ${currentCategory.color}`}
              >
                {currentCategory.icon} {currentCategory.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile: Edit/Preview Toggle */}
            <div className="md:hidden flex items-center bg-primary/5 dark:bg-white/5 rounded-lg overflow-hidden">
              <button
                onClick={() => setIsPreviewMode(false)}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm transition-colors ${
                  !isPreviewMode
                    ? "bg-accent text-white"
                    : "text-text-secondary dark:text-text-dark-secondary"
                }`}
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => setIsPreviewMode(true)}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm transition-colors ${
                  isPreviewMode
                    ? "bg-accent text-white"
                    : "text-text-secondary dark:text-text-dark-secondary"
                }`}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg hover:bg-primary/5 dark:hover:bg-white/5 transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-primary/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metadata: Title & Category */}
        <div className="p-4 border-b border-primary/10 dark:border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title..."
                className="w-full px-3 py-2 rounded-lg border border-primary/10 dark:border-white/10 bg-background-primary dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryKey)}
                className="w-full px-3 py-2 rounded-lg border border-primary/10 dark:border-white/10 bg-background-primary dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                {CATEGORIES.filter((cat) => !cat.wip).map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Mobile View */}
          <div className="md:hidden w-full flex flex-col">
            {!isPreviewMode ? (
              <div className="flex-1 flex flex-col">
                {/* Mobile Toolbar */}
                <div className="p-2 flex items-center gap-1 min-h-[52px] border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
                  <button
                    onClick={() => handleFormatting("bold")}
                    className="p-2 rounded hover:bg-primary/5 dark:hover:bg-white/5"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFormatting("italic")}
                    className="p-2 rounded hover:bg-primary/5 dark:hover:bg-white/5"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFormatting("link")}
                    className="p-2 rounded hover:bg-primary/5 dark:hover:bg-white/5"
                    title="Link"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFormatting("image")}
                    className="p-2 rounded hover:bg-primary/5 dark:hover:bg-white/5"
                    title="Upload Image"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Image className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleFormatting("list")}
                    className="p-2 rounded hover:bg-primary/5 dark:hover:bg-white/5"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFormatting("ordered-list")}
                    className="p-2 rounded hover:bg-primary/5 dark:hover:bg-white/5"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile Editor */}
                <div className="flex-1 relative">
                  <textarea
                    ref={contentRef}
                    value={content}
                    onChange={(e) => handleContentChange(e, true)}
                    onKeyDown={handleContentKeyDown}
                    onPaste={handlePaste}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    placeholder="Write your content... (use #tag to add tags, @user to mention)"
                    className="w-full h-full p-4 border-0 focus:outline-none resize-none bg-background-primary dark:bg-background-dark"
                    style={{ minHeight: "300px" }}
                  />
                  {mentionState.isActive &&
                    mentionState.targetRef === "mobile" &&
                    mentionState.position && (
                      <MentionAutocomplete
                        query={mentionState.query}
                        position={{ top: 60, left: 16 }}
                        onSelect={handleMentionSelect}
                        onClose={handleMentionClose}
                      />
                    )}
                </div>
              </div>
            ) : (
              /* Mobile Preview */
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-text-secondary dark:text-text-dark-secondary italic">
                      Preview will appear here...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop View - Split Pane */}
          <div className="hidden md:flex w-full">
            {/* Editor Pane */}
            <div className="w-1/2 flex flex-col border-r border-primary/10 dark:border-white/10">
              {/* Desktop Toolbar */}
              <div className="p-2 flex items-center gap-1 min-h-[52px] border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
                <button
                  onClick={() => handleFormatting("bold")}
                  className="p-2 rounded hover:bg-primary/5 dark:hover:bg-white/5"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFormatting("italic")}
                  className="p-2 rounded hover:bg-primary/5 dark:hover:bg-white/5"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFormatting("link")}
                  className="p-2 rounded hover:bg-primary/5 dark:hover:bg-white/5"
                  title="Link"
                >
                  <Link2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFormatting("image")}
                  className="p-2 rounded hover:bg-primary/5 dark:hover:bg-white/5"
                  title="Upload Image"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Image className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleFormatting("list")}
                  className="p-2 rounded hover:bg-primary/5 dark:hover:bg-white/5"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFormatting("ordered-list")}
                  className="p-2 rounded hover:bg-primary/5 dark:hover:bg-white/5"
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
              </div>

              {/* Desktop Editor */}
              <div className="flex-1 overflow-hidden relative">
                <textarea
                  ref={contentRefDesktop}
                  value={content}
                  onChange={(e) => handleContentChange(e, false)}
                  onKeyDown={handleContentKeyDown}
                  onPaste={handlePaste}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  placeholder="Write your content... (use #tag to add tags, @user to mention)"
                  className="w-full h-full p-4 border-0 focus:outline-none resize-none bg-background-primary dark:bg-background-dark"
                  style={{ minHeight: "400px" }}
                />
                {mentionState.isActive &&
                  mentionState.targetRef === "desktop" &&
                  mentionState.position && (
                    <MentionAutocomplete
                      query={mentionState.query}
                      position={{ top: 60, left: 16 }}
                      onSelect={handleMentionSelect}
                      onClose={handleMentionClose}
                    />
                  )}
              </div>
            </div>

            {/* Preview Pane */}
            <div className="w-1/2 flex flex-col">
              {/* Preview Header */}
              <div className="p-2 flex items-center gap-2 min-h-[52px] border-b border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">Preview</span>
              </div>

              {/* Preview Content */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-text-secondary dark:text-text-dark-secondary italic">
                      Preview will appear here...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-primary/10 dark:border-white/10">
          {/* Show extracted tags */}
          {extractHashtags(content).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {extractHashtags(content).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
              Markdown supported. Use #hashtag to add tags, @username to
              mention.
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !title.trim() || !content.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {isEditMode ? "Saving..." : "Publishing..."}
                  </>
                ) : isEditMode ? (
                  "Save"
                ) : (
                  "Publish"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
