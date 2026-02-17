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
      location.pathname.startsWith(item.to.split("#")[0])
  );

  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded]);

  useEffect(() => {
    if (!isControlled && (isActive || isChildActive)) {
      setInternalExpanded(true);
    }
  }, [isActive, isChildActive, isControlled]);

  const handleTitleClick = () => {
    if (isExpanded) {
      // If already expanded, toggle (collapse)
      if (isControlled && onToggle) {
        onToggle();
      } else {
        setInternalExpanded(false);
      }
    } else {
      // If collapsed, expand and navigate
      if (isControlled && onToggle) {
        onToggle();
      } else {
        setInternalExpanded(true);
      }
      navigate(titleTo);
      onItemClick?.();
    }
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
          className={`menu-dropdown-title ${isActive ? "active" : ""}`}
          style={{
            flex: 1,
            textAlign: "left",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            color:
              isActive || isHovered
                ? "var(--primary-color, #2d2a26)"
                : "inherit",
          }}
        >
          {title}
        </button>
        <button
          onClick={toggleExpanded}
          className="menu-dropdown-toggle"
          style={{
            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px",
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

export default MenuDropdown;
