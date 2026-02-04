import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ApiItem {
  id: string;
  title: string;
  category: string;
  description?: string;
  parameters?: string;
  returns?: string;
  path: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const apiData: ApiItem[] = [
  // Core APIs
  {
    id: "initialize-sdk",
    title: "initializeSDK",
    category: "Core",
    description: "Initialize the Locanara SDK",
    parameters: "Platform",
    returns: "VoidResult",
    path: "/docs/apis#initialize-sdk",
  },
  {
    id: "get-device-capability",
    title: "getDeviceCapability",
    category: "Core",
    description: "Get device AI capabilities",
    parameters: "",
    returns: "DeviceCapability",
    path: "/docs/apis#get-device-capability",
  },
  {
    id: "is-feature-available",
    title: "isFeatureAvailable",
    category: "Core",
    description: "Check if a specific AI feature is available",
    parameters: "FeatureType",
    returns: "Boolean",
    path: "/docs/apis#is-feature-available",
  },

  // Feature APIs
  {
    id: "summarize",
    title: "summarize",
    category: "Features",
    description: "Summarize text into key points",
    parameters: "SummarizeParametersInput",
    returns: "SummarizeResult",
    path: "/docs/apis#summarize",
  },
  {
    id: "classify",
    title: "classify",
    category: "Features",
    description: "Classify text into categories",
    parameters: "ClassifyParametersInput",
    returns: "ClassifyResult",
    path: "/docs/apis#classify",
  },
  {
    id: "extract",
    title: "extract",
    category: "Features",
    description: "Extract entities and key-value pairs from text",
    parameters: "ExtractParametersInput",
    returns: "ExtractResult",
    path: "/docs/apis#extract",
  },
  {
    id: "chat",
    title: "chat",
    category: "Features",
    description: "Conversational AI interactions",
    parameters: "ChatParametersInput",
    returns: "ChatResult",
    path: "/docs/apis#chat",
  },
  {
    id: "translate",
    title: "translate",
    category: "Features",
    description: "Translate text between languages",
    parameters: "TranslateParametersInput",
    returns: "TranslateResult",
    path: "/docs/apis#translate",
  },
  {
    id: "rewrite",
    title: "rewrite",
    category: "Features",
    description: "Rewrite text with different styles",
    parameters: "RewriteParametersInput",
    returns: "RewriteResult",
    path: "/docs/apis#rewrite",
  },
  {
    id: "proofread",
    title: "proofread",
    category: "Features",
    description: "Grammar and spelling correction",
    parameters: "ProofreadParametersInput",
    returns: "ProofreadResult",
    path: "/docs/apis#proofread",
  },
  {
    id: "describe-image",
    title: "describeImage",
    category: "Features",
    description: "Generate descriptions for images",
    parameters: "ImageDescriptionParametersInput",
    returns: "ImageDescriptionResult",
    path: "/docs/apis#describe-image",
  },

  // iOS APIs
  {
    id: "execute-feature-ios",
    title: "executeFeatureIOS",
    category: "iOS APIs",
    description: "Execute AI feature with iOS-specific options",
    parameters: "ExecuteFeatureInput, ExecuteFeatureIOSOptions",
    returns: "ExecutionResult",
    path: "/docs/apis/ios#execute-feature-ios",
  },
  {
    id: "get-foundation-model-status",
    title: "getFoundationModelStatus",
    category: "iOS APIs",
    description: "Get Foundation Models availability status",
    parameters: "",
    returns: "FoundationModelInfoIOS",
    path: "/docs/apis/ios#get-foundation-model-status",
  },

  // Android APIs
  {
    id: "execute-feature-android",
    title: "executeFeatureAndroid",
    category: "Android APIs",
    description: "Execute AI feature with Android-specific options",
    parameters: "ExecuteFeatureInput, ExecuteFeatureOptionsAndroid",
    returns: "ExecutionResult",
    path: "/docs/apis/android#execute-feature-android",
  },
  {
    id: "get-gemini-nano-status",
    title: "getGeminiNanoStatus",
    category: "Android APIs",
    description: "Get Gemini Nano availability and download status",
    parameters: "",
    returns: "GeminiNanoInfoAndroid",
    path: "/docs/apis/android#get-gemini-nano-status",
  },
  {
    id: "download-gemini-nano",
    title: "downloadGeminiNano",
    category: "Android APIs",
    description: "Download Gemini Nano model",
    parameters: "variant: String?",
    returns: "VoidResult",
    path: "/docs/apis/android#download-gemini-nano",
  },

  // Types
  {
    id: "device-capability",
    title: "DeviceCapability",
    category: "Types",
    description: "Device AI capabilities and available features",
    path: "/docs/types#device-capability",
  },
  {
    id: "execution-result",
    title: "ExecutionResult",
    category: "Types",
    description: "Result of AI feature execution",
    path: "/docs/types#execution-result",
  },
  {
    id: "feature-type",
    title: "FeatureType",
    category: "Types",
    description: "Enum of available AI features",
    path: "/docs/types#feature-type",
  },
  {
    id: "summarize-result",
    title: "SummarizeResult",
    category: "Types",
    description: "Result of text summarization",
    path: "/docs/types#summarize-result",
  },
  {
    id: "classify-result",
    title: "ClassifyResult",
    category: "Types",
    description: "Result of text classification",
    path: "/docs/types#classify-result",
  },
  {
    id: "translate-result",
    title: "TranslateResult",
    category: "Types",
    description: "Result of text translation",
    path: "/docs/types#translate-result",
  },
  {
    id: "rewrite-result",
    title: "RewriteResult",
    category: "Types",
    description: "Result of text rewriting",
    path: "/docs/types#rewrite-result",
  },
  {
    id: "proofread-result",
    title: "ProofreadResult",
    category: "Types",
    description: "Result of proofreading",
    path: "/docs/types#proofread-result",
  },

  // Documentation Pages
  {
    id: "ios-setup",
    title: "iOS Setup",
    category: "Documentation",
    description: "Setup guide for iOS with Apple Intelligence",
    path: "/docs/ios-setup",
  },
  {
    id: "android-setup",
    title: "Android Setup",
    category: "Documentation",
    description: "Setup guide for Android with Gemini Nano",
    path: "/docs/android-setup",
  },
  {
    id: "types-page",
    title: "Types",
    category: "Documentation",
    description: "Type definitions and data structures",
    path: "/docs/types",
  },
  {
    id: "apis-page",
    title: "APIs",
    category: "Documentation",
    description: "API reference and function signatures",
    path: "/docs/apis",
  },
  {
    id: "errors-page",
    title: "Errors",
    category: "Documentation",
    description: "Error codes and error handling",
    path: "/docs/errors",
  },
];

function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filteredApis = useMemo(() => {
    if (!searchQuery) return [];

    const query = searchQuery.toLowerCase();
    return apiData.filter(
      (api) =>
        api.title.toLowerCase().includes(query) ||
        api.description?.toLowerCase().includes(query) ||
        api.parameters?.toLowerCase().includes(query) ||
        api.returns?.toLowerCase().includes(query) ||
        api.category.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredApis.length - 1 ? prev + 1 : prev,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && filteredApis.length > 0) {
        e.preventDefault();
        const selectedApi = filteredApis[selectedIndex];
        if (selectedApi) {
          navigate(selectedApi.path);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredApis, selectedIndex, navigate, onClose]);

  const handleApiClick = (api: ApiItem) => {
    navigate(api.path);
    onClose();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="search-highlight">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="search-modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="search-modal-container">
        <div className="search-modal">
          <div className="search-modal-header">
            <Search className="search-modal-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search APIs..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="search-modal-input"
            />
            <button onClick={onClose} className="search-modal-close">
              <X />
            </button>
          </div>

          {searchQuery && (
            <div className="search-modal-results">
              {filteredApis.length > 0 ? (
                <>
                  <div className="search-result-count">
                    {filteredApis.length} result
                    {filteredApis.length !== 1 ? "s" : ""}
                  </div>
                  <div className="search-result-list">
                    {filteredApis.map((api, index) => (
                      <button
                        key={api.id}
                        onClick={() => handleApiClick(api)}
                        className={`search-result-item ${
                          index === selectedIndex ? "selected" : ""
                        }`}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className="search-result-content">
                          <div className="search-result-header">
                            <span className="search-result-title">
                              {highlightMatch(api.title, searchQuery)}
                            </span>
                            <span className="search-result-category">
                              {api.category}
                            </span>
                          </div>
                          {api.description && (
                            <p className="search-result-description">
                              {highlightMatch(api.description, searchQuery)}
                            </p>
                          )}
                          <div className="search-result-meta">
                            {api.parameters && (
                              <span className="search-result-params">
                                {highlightMatch(api.parameters, searchQuery)}
                              </span>
                            )}
                            {api.returns && (
                              <span className="search-result-returns">
                                → {highlightMatch(api.returns, searchQuery)}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="search-no-results">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}

          <div className="search-modal-footer">
            <div className="search-shortcuts">
              <span className="search-shortcut">
                <kbd>↑↓</kbd> Navigate
              </span>
              <span className="search-shortcut">
                <kbd>Enter</kbd> Select
              </span>
              <span className="search-shortcut">
                <kbd>Esc</kbd> Close
              </span>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

export default SearchModal;
