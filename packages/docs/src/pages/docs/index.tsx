import { useState, useEffect } from "react";
import { Route, Routes, Navigate, NavLink } from "react-router-dom";
import { MenuDropdown } from "../../components/MenuDropdown";

import TypesIndex from "./types/index";
import TypesIOS from "./types/ios";
import TypesAndroid from "./types/android";
import APIsIndex from "./apis/index";
import APIsIOS from "./apis/ios";
import APIsAndroid from "./apis/android";
import SummarizeAPI from "./apis/summarize";
import ClassifyAPI from "./apis/classify";
import ExtractAPI from "./apis/extract";
import ChatAPI from "./apis/chat";
import TranslateAPI from "./apis/translate";
import RewriteAPI from "./apis/rewrite";
import ProofreadAPI from "./apis/proofread";
import DescribeImageAPI from "./apis/describe-image";
import GetDeviceCapabilityAPI from "./apis/get-device-capability";
import Errors from "./errors";
import IOSSetup from "./ios-setup";
import AndroidSetup from "./android-setup";
import WebSetup from "./web-setup";
import TypesWeb from "./types/web";
import APIsWeb from "./apis/web";
import Example from "./example";
import Resources from "./resources";
import TutorialsIndex from "./tutorials/index";
import TutorialsIOS from "./tutorials/ios";
import TutorialsAndroid from "./tutorials/android";
import TutorialsWeb from "./tutorials/web";
import IOSSummarizeTutorial from "./tutorials/ios-summarize";
import IOSChatTutorial from "./tutorials/ios-chat";
import IOSRewriteTutorial from "./tutorials/ios-rewrite";
import AndroidSummarizeTutorial from "./tutorials/android-summarize";
import AndroidChatTutorial from "./tutorials/android-chat";
import AndroidRewriteTutorial from "./tutorials/android-rewrite";
import WebSummarizeTutorial from "./tutorials/web-summarize";
import WebChatTutorial from "./tutorials/web-chat";
import WebTranslateTutorial from "./tutorials/web-translate";
import Introduction from "./introduction";
import WhyLocanara from "./why-locanara";
import LibrariesIndex from "./libraries/index";
import ExpoLibrary from "./libraries/expo";
import NotFound from "../404";

function Docs() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [expandedTutorial, setExpandedTutorial] = useState<string | null>(null);
  const [expandedReference, setExpandedReference] = useState<string | null>(
    null,
  );

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleTutorialToggle = (sdk: string) => {
    setExpandedTutorial((prev) => (prev === sdk ? null : sdk));
  };

  const handleReferenceToggle = (ref: string) => {
    setExpandedReference((prev) => (prev === ref ? null : ref));
  };

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
                { to: "/docs/apis/summarize", label: "summarize" },
                { to: "/docs/apis/classify", label: "classify" },
                { to: "/docs/apis/extract", label: "extract" },
                { to: "/docs/apis/chat", label: "chat" },
                { to: "/docs/apis/translate", label: "translate" },
                { to: "/docs/apis/rewrite", label: "rewrite" },
                { to: "/docs/apis/proofread", label: "proofread" },
                { to: "/docs/apis/describe-image", label: "describeImage" },
                { to: "/docs/apis/ios", label: "iOS Specific" },
                { to: "/docs/apis/android", label: "Android Specific" },
                { to: "/docs/apis/web", label: "Web Specific" },
              ]}
              onItemClick={closeSidebar}
              isExpanded={expandedReference === "apis"}
              onToggle={() => handleReferenceToggle("apis")}
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
          <h3 style={{ marginTop: "2rem" }}>Tutorials</h3>
          <ul>
            <MenuDropdown
              title="iOS SDK"
              titleTo="/docs/tutorials/ios"
              items={[
                { to: "/docs/ios-setup", label: "Setup Guide" },
                { to: "/docs/tutorials/ios-summarize", label: "Summarize" },
                { to: "/docs/tutorials/ios-chat", label: "Chat" },
                { to: "/docs/tutorials/ios-rewrite", label: "Rewrite" },
              ]}
              onItemClick={closeSidebar}
              isExpanded={expandedTutorial === "ios"}
              onToggle={() => handleTutorialToggle("ios")}
            />
            <MenuDropdown
              title="Android SDK"
              titleTo="/docs/tutorials/android"
              items={[
                { to: "/docs/android-setup", label: "Setup Guide" },
                { to: "/docs/tutorials/android-summarize", label: "Summarize" },
                { to: "/docs/tutorials/android-chat", label: "Chat" },
                { to: "/docs/tutorials/android-rewrite", label: "Rewrite" },
              ]}
              onItemClick={closeSidebar}
              isExpanded={expandedTutorial === "android"}
              onToggle={() => handleTutorialToggle("android")}
            />
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
          <Route path="apis/ios" element={<APIsIOS />} />
          <Route path="apis/android" element={<APIsAndroid />} />
          <Route path="apis/web" element={<APIsWeb />} />
          <Route
            path="apis/get-device-capability"
            element={<GetDeviceCapabilityAPI />}
          />
          <Route path="apis/summarize" element={<SummarizeAPI />} />
          <Route path="apis/classify" element={<ClassifyAPI />} />
          <Route path="apis/extract" element={<ExtractAPI />} />
          <Route path="apis/chat" element={<ChatAPI />} />
          <Route path="apis/translate" element={<TranslateAPI />} />
          <Route path="apis/rewrite" element={<RewriteAPI />} />
          <Route path="apis/proofread" element={<ProofreadAPI />} />
          <Route path="apis/describe-image" element={<DescribeImageAPI />} />
          <Route path="errors" element={<Errors />} />
          <Route path="ios-setup" element={<IOSSetup />} />
          <Route path="android-setup" element={<AndroidSetup />} />
          <Route path="web-setup" element={<WebSetup />} />
          <Route path="example" element={<Example />} />
          <Route path="resources" element={<Resources />} />
          <Route path="tutorials" element={<TutorialsIndex />} />
          <Route path="tutorials/ios" element={<TutorialsIOS />} />
          <Route
            path="tutorials/ios-summarize"
            element={<IOSSummarizeTutorial />}
          />
          <Route path="tutorials/ios-chat" element={<IOSChatTutorial />} />
          <Route
            path="tutorials/ios-rewrite"
            element={<IOSRewriteTutorial />}
          />
          <Route path="tutorials/android" element={<TutorialsAndroid />} />
          <Route
            path="tutorials/android-summarize"
            element={<AndroidSummarizeTutorial />}
          />
          <Route
            path="tutorials/android-chat"
            element={<AndroidChatTutorial />}
          />
          <Route
            path="tutorials/android-rewrite"
            element={<AndroidRewriteTutorial />}
          />
          <Route path="tutorials/web" element={<TutorialsWeb />} />
          <Route
            path="tutorials/web-summarize"
            element={<WebSummarizeTutorial />}
          />
          <Route path="tutorials/web-chat" element={<WebChatTutorial />} />
          <Route
            path="tutorials/web-translate"
            element={<WebTranslateTutorial />}
          />
          <Route path="libraries" element={<LibrariesIndex />} />
          <Route path="libraries/expo" element={<ExpoLibrary />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default Docs;
