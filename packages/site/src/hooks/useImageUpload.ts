import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface UploadOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  onError?: (error: Error) => void;
}

export interface UploadResult {
  url: string;
  filename: string;
}

export function useImageUpload(options: UploadOptions = {}) {
  const {
    maxSizeMB = 10,
    allowedTypes = ["image/"],
    onUploadStart,
    onUploadEnd,
    onError,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const generateUploadUrl = useMutation(api.files.mutation.generateUploadUrl);
  const saveFileMetadata = useMutation(api.files.mutation.saveFileMetadata);

  const isAllowedType = useCallback(
    (type: string) => {
      return allowedTypes.some((allowed) => type.startsWith(allowed));
    },
    [allowedTypes]
  );

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      // Validate file type
      if (!isAllowedType(file.type)) {
        onError?.(new Error(`File type ${file.type} is not allowed`));
        return null;
      }

      // Validate file size
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        onError?.(new Error(`File size must be less than ${maxSizeMB}MB`));
        return null;
      }

      setIsUploading(true);
      onUploadStart?.();

      try {
        // Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();

        // Upload file to storage
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const { storageId } = await response.json();

        // Save file metadata
        const result = await saveFileMetadata({
          storageId,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        });

        setUploadedUrls((prev) => [...prev, result.url]);

        return {
          url: result.url,
          filename: file.name,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Upload failed");
        onError?.(err);
        console.error("Upload failed:", error);
        return null;
      } finally {
        setIsUploading(false);
        onUploadEnd?.();
      }
    },
    [
      generateUploadUrl,
      saveFileMetadata,
      isAllowedType,
      maxSizeMB,
      onUploadStart,
      onUploadEnd,
      onError,
    ]
  );

  const uploadFromClipboard = useCallback(
    async (clipboardData: DataTransfer): Promise<UploadResult | null> => {
      for (const item of clipboardData.items) {
        if (isAllowedType(item.type)) {
          const file = item.getAsFile();
          if (file) {
            return upload(file);
          }
        }
      }
      return null;
    },
    [upload, isAllowedType]
  );

  const uploadFromDrop = useCallback(
    async (dataTransfer: DataTransfer): Promise<UploadResult | null> => {
      const file = dataTransfer.files[0];
      if (file && isAllowedType(file.type)) {
        return upload(file);
      }
      return null;
    },
    [upload, isAllowedType]
  );

  const reset = useCallback(() => {
    setUploadedUrls([]);
  }, []);

  return {
    upload,
    uploadFromClipboard,
    uploadFromDrop,
    isUploading,
    uploadedUrls,
    reset,
  };
}
