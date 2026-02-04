import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

interface MenuItem {
  to: string;
  label: string;
}

interface MenuDropdownProps {
  title: string;
  titleTo: string;
  items: MenuItem[];
  onItemClick?: () => void;
  // Controlled mode props for accordion behavior
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function MenuDropdown({
  title,
  titleTo,
  items,
  onItemClick,
  isExpanded: controlledExpanded,
  onToggle,
}: MenuDropdownProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === titleTo;
  const isChildActive = items.some(
    (item) =>
      location.pathname === item.to ||
      location.pathname.startsWith(item.to.split("#")[0]),
  );

  // Use controlled or uncontrolled mode
  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded]);

  useEffect(() => {
    // Auto-expand when navigating to the title page or any child item (only in uncontrolled mode)
    if (!isControlled && (isActive || isChildActive)) {
      setInternalExpanded(true);
    }
  }, [isActive, isChildActive, isControlled]);

  const handleTitleClick = () => {
    // Navigate to the page without toggling
    navigate(titleTo);
    onItemClick?.();
  };

  const toggleExpanded = () => {
    if (isControlled && onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  return (
    <li className="menu-dropdown">
      <div className={`menu-dropdown-header ${isActive ? "active" : ""}`}>
        <button
          onClick={handleTitleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`menu-dropdown-title ${isActive ? "active" : ""} ${isHovered ? "hovered" : ""}`}
        >
          {title}
        </button>
        <button
          onClick={toggleExpanded}
          className="menu-dropdown-toggle"
          style={{
            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
          }}
          aria-label={`Toggle ${title} submenu`}
        >
          ▶
        </button>
      </div>
      <div
        ref={contentRef}
        className="menu-dropdown-content"
        style={{
          maxHeight: `${height}px`,
        }}
      >
        <ul className="menu-dropdown-items">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `menu-dropdown-item ${isActive ? "active" : ""}`
                }
                onClick={onItemClick}
              >
                <span className="menu-dropdown-item-prefix">└</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
