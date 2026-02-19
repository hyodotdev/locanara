import { useState, useEffect } from "react";
import {
  Route,
  Routes,
  Navigate,
  NavLink,
  useLocation,
} from "react-router-dom";
import { MenuDropdown } from "../../components/docs/MenuDropdown";

import TypesIndex from "./types/index";
import TypesIOS from "./types/ios";
import TypesAndroid from "./types/android";
import APIsIndex from "./apis/index";
import GetDeviceCapabilityAPI from "./apis/get-device-capability";
import ChainAPI from "./apis/chain";
import PipelineAPI from "./apis/pipeline";
import MemoryAPI from "./apis/memory";
import GuardrailAPI from "./apis/guardrail";
import SessionAPI from "./apis/session";
import AgentAPI from "./apis/agent";
import ModelAPI from "./apis/model";
import UtilsIndex from "./utils/index";
import UtilsIOS from "./utils/ios";
import UtilsAndroid from "./utils/android";
import SummarizeAPI from "./utils/summarize";
import ClassifyAPI from "./utils/classify";
import ExtractAPI from "./utils/extract";
import ChatAPI from "./utils/chat";
import TranslateAPI from "./utils/translate";
import RewriteAPI from "./utils/rewrite";
import ProofreadAPI from "./utils/proofread";
import DescribeImageAPI from "./utils/describe-image";
import Errors from "./errors";
import IOSSetup from "./ios-setup";
import AndroidSetup from "./android-setup";
import WebSetup from "./web-setup";
import TypesWeb from "./types/web";
import UtilsWeb from "./utils/web";
import Example from "./example";
import Resources from "./resources";
import TutorialsIndex from "./tutorials/index";
import ModelSelectionTutorial from "./tutorials/model-selection";
import SummarizeTutorial from "./tutorials/summarize";
import ClassifyTutorial from "./tutorials/classify";
import ExtractTutorial from "./tutorials/extract";
import TranslateTutorial from "./tutorials/translate";
import ChatTutorial from "./tutorials/chat";
import RewriteTutorial from "./tutorials/rewrite";
import ProofreadTutorial from "./tutorials/proofread";
import Introduction from "./introduction";
import WhyLocanara from "./why-locanara";
import LibrariesIndex from "./libraries/index";
import ExpoLibrary from "./libraries/expo";
import { NotFound } from "../404";

function Docs() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [expandedReference, setExpandedReference] = useState<string | null>(
    null
  );

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleReferenceToggle = (ref: string) => {
    setExpandedReference((prev) => (prev === ref ? null : ref));
  };

  // Auto-expand sidebar sections based on current URL
  useEffect(() => {
    const path = location.pathname;

    // Auto-expand reference sections
    if (path.includes("/docs/types")) {
      setExpandedReference("types");
    } else if (path.includes("/docs/apis")) {
      setExpandedReference("apis");
    } else if (path.includes("/docs/utils")) {
      setExpandedReference("utils");
    } else {
      setExpandedReference(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="docs-container">
      <button
        className={`docs-sidebar-toggle ${isSidebarOpen ? "hidden" : ""} ${isScrolled ? "scrolled" : ""}`}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span>Menu</span>
      </button>

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      <aside className={`docs-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <nav className="docs-nav">
          <h3>Getting Started</h3>
          <ul>
            <li>
              <NavLink
                to="/docs/introduction"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                Introduction
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/docs/why-locanara"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                Why Locanara?
              </NavLink>
            </li>
          </ul>
          <h3 style={{ marginTop: "2rem" }}>Reference</h3>
          <ul>
            <MenuDropdown
              title="Types"
              titleTo="/docs/types"
              items={[
                { to: "/docs/types/ios", label: "iOS Types" },
                { to: "/docs/types/android", label: "Android Types" },
                { to: "/docs/types/web", label: "Web Types" },
              ]}
              onItemClick={closeSidebar}
              isExpanded={expandedReference === "types"}
              onToggle={() => handleReferenceToggle("types")}
            />
            <MenuDropdown
              title="APIs"
              titleTo="/docs/apis"
              items={[
                {
                  to: "/docs/apis/get-device-capability",
                  label: "getDeviceCapability",
                },
                { to: "/docs/apis/chain", label: "Chain" },
                { to: "/docs/apis/pipeline", label: "Pipeline" },
                { to: "/docs/apis/memory", label: "Memory" },
                { to: "/docs/apis/guardrail", label: "Guardrail" },
                { to: "/docs/apis/session", label: "Session" },
                { to: "/docs/apis/agent", label: "Agent" },
                { to: "/docs/apis/model", label: "Model" },
              ]}
              onItemClick={closeSidebar}
              isExpanded={expandedReference === "apis"}
              onToggle={() => handleReferenceToggle("apis")}
            />
            <MenuDropdown
              title="Built-in Utils"
              titleTo="/docs/utils"
              items={[
                { to: "/docs/utils/summarize", label: "summarize" },
                { to: "/docs/utils/classify", label: "classify" },
                { to: "/docs/utils/extract", label: "extract" },
                { to: "/docs/utils/chat", label: "chat" },
                { to: "/docs/utils/translate", label: "translate" },
                { to: "/docs/utils/rewrite", label: "rewrite" },
                { to: "/docs/utils/proofread", label: "proofread" },
                { to: "/docs/utils/ios", label: "iOS Specific" },
                { to: "/docs/utils/android", label: "Android Specific" },
                { to: "/docs/utils/web", label: "Web Specific" },
              ]}
              onItemClick={closeSidebar}
              isExpanded={expandedReference === "utils"}
              onToggle={() => handleReferenceToggle("utils")}
            />
            <li>
              <NavLink
                to="/docs/errors"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                Errors
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/docs/resources"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                Resources
              </NavLink>
            </li>
          </ul>
          <h3 style={{ marginTop: "2rem" }}>Setup Guides</h3>
          <ul>
            <li>
              <NavLink
                to="/docs/ios-setup"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                iOS Setup
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/docs/android-setup"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                Android Setup
              </NavLink>
            </li>
          </ul>
          <h3 style={{ marginTop: "2rem" }}>Tutorials</h3>
          <ul>
            <li>
              <NavLink
                to="/docs/tutorials/summarize"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                Summarize
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/docs/tutorials/classify"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                Classify
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/docs/tutorials/extract"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                Extract
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/docs/tutorials/chat"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                Chat
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/docs/tutorials/translate"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                Translate
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/docs/tutorials/rewrite"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                Rewrite
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/docs/tutorials/proofread"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                Proofread
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/docs/tutorials/model-selection"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                Model Selection
              </NavLink>
            </li>
          </ul>
          <h3 style={{ marginTop: "2rem" }}>Libraries</h3>
          <ul>
            <li>
              <NavLink
                to="/docs/libraries/expo"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                expo-ondevice-ai
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="docs-content">
        <Routes>
          <Route index element={<Navigate to="/docs/introduction" replace />} />
          <Route path="introduction" element={<Introduction />} />
          <Route path="why-locanara" element={<WhyLocanara />} />
          <Route path="types" element={<TypesIndex />} />
          <Route path="types/ios" element={<TypesIOS />} />
          <Route path="types/android" element={<TypesAndroid />} />
          <Route path="types/web" element={<TypesWeb />} />
          <Route path="apis" element={<APIsIndex />} />
          <Route
            path="apis/get-device-capability"
            element={<GetDeviceCapabilityAPI />}
          />
          <Route path="apis/chain" element={<ChainAPI />} />
          <Route path="apis/pipeline" element={<PipelineAPI />} />
          <Route path="apis/memory" element={<MemoryAPI />} />
          <Route path="apis/guardrail" element={<GuardrailAPI />} />
          <Route path="apis/session" element={<SessionAPI />} />
          <Route path="apis/agent" element={<AgentAPI />} />
          <Route path="apis/model" element={<ModelAPI />} />
          <Route path="utils" element={<UtilsIndex />} />
          <Route path="utils/ios" element={<UtilsIOS />} />
          <Route path="utils/android" element={<UtilsAndroid />} />
          <Route path="utils/web" element={<UtilsWeb />} />
          <Route path="utils/summarize" element={<SummarizeAPI />} />
          <Route path="utils/classify" element={<ClassifyAPI />} />
          <Route path="utils/extract" element={<ExtractAPI />} />
          <Route path="utils/chat" element={<ChatAPI />} />
          <Route path="utils/translate" element={<TranslateAPI />} />
          <Route path="utils/rewrite" element={<RewriteAPI />} />
          <Route path="utils/proofread" element={<ProofreadAPI />} />
          <Route path="utils/describe-image" element={<DescribeImageAPI />} />
          <Route path="errors" element={<Errors />} />
          <Route path="ios-setup" element={<IOSSetup />} />
          <Route path="android-setup" element={<AndroidSetup />} />
          <Route path="web-setup" element={<WebSetup />} />
          <Route path="example" element={<Example />} />
          <Route path="resources" element={<Resources />} />
          <Route path="tutorials" element={<TutorialsIndex />} />
          {/* Redirects from old getting-started URLs */}
          <Route
            path="tutorials/ios"
            element={<Navigate to="/docs/ios-setup" replace />}
          />
          <Route
            path="tutorials/android"
            element={<Navigate to="/docs/android-setup" replace />}
          />
          <Route
            path="tutorials/web"
            element={<Navigate to="/docs/web-setup" replace />}
          />
          <Route
            path="tutorials/model-selection"
            element={<ModelSelectionTutorial />}
          />
          <Route path="tutorials/summarize" element={<SummarizeTutorial />} />
          <Route path="tutorials/classify" element={<ClassifyTutorial />} />
          <Route path="tutorials/extract" element={<ExtractTutorial />} />
          <Route path="tutorials/translate" element={<TranslateTutorial />} />
          <Route path="tutorials/chat" element={<ChatTutorial />} />
          <Route path="tutorials/rewrite" element={<RewriteTutorial />} />
          <Route path="tutorials/proofread" element={<ProofreadTutorial />} />
          <Route path="libraries" element={<LibrariesIndex />} />
          <Route path="libraries/expo" element={<ExpoLibrary />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default Docs;
