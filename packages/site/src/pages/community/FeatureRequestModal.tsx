import { useState, useRef, useEffect } from "react";
import { X, Lightbulb } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../../components/uis/Button";

interface FeatureRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeatureRequestModal({
  isOpen,
  onClose,
}: FeatureRequestModalProps) {
  const createRequest = useMutation(
    api.featureRequests.mutation.createFeatureRequest
  );
  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasAppeared, setHasAppeared] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasAppeared(false);
      const timer = setTimeout(() => setHasAppeared(true), 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && hasAppeared) {
      titleRef.current?.focus();
    }
  }, [isOpen, hasAppeared]);

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setIsClosing(false);
      setHasAppeared(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 150);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await createRequest({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      handleClose();
    } catch (error) {
      console.error("Failed to create feature request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
    if (e.key === "Enter" && e.metaKey) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-150 ${
        hasAppeared && !isClosing ? "opacity-100" : "opacity-0"
      }`}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative w-full max-w-lg bg-[#faf8f5] dark:bg-[#1a1a1a] rounded-xl shadow-2xl transition-all duration-150 ${
          hasAppeared && !isClosing
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">Request a Feature</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-primary/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-text-primary dark:text-text-dark-primary">
              Title <span className="text-accent">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What feature would you like to see?"
              className="w-full px-3 py-2 rounded-lg border border-primary/20 dark:border-white/20 bg-white dark:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm text-text-primary dark:text-text-dark-primary placeholder:text-gray-400 dark:placeholder:text-gray-500"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-text-primary dark:text-text-dark-primary">
              Description{" "}
              <span className="text-text-secondary dark:text-text-dark-secondary">
                (optional)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your feature request in detail..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-primary/20 dark:border-white/20 bg-white dark:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm resize-none text-text-primary dark:text-text-dark-primary placeholder:text-gray-400 dark:placeholder:text-gray-500"
              maxLength={2000}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-primary/10 dark:border-white/10">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
            loading={isSubmitting}
          >
            Submit Request
          </Button>
        </div>
      </div>
    </div>
  );
}
