import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
const sidebarWidth = 280;

const menuItems = [
  { name: "Dashboard", icon: "📊", path: "/" },
  { name: "Ticket", icon: "💬", path: "/ticket" },
  { name: "Public User", icon: "🙎🏻‍♂️", path: "/user" },
  { name: "Amazon S3", icon: "📂", path: "/amazonS3" },
  { name: "Outgoing Remittance", icon: "💸", path: "/outgoingRemittance" },
  { name: "Incoming Remittance", icon: "💸", path: "/incomingRemittance" },
  { name: "Invoice", icon: "💸", path: "/invoice" },
  { name: "Edit Pool", path: "/kyc-verification", icon: "🎱" },
  { name: "Weight Discrepancy", path: "/weight-discrepancy", icon: "𐄷" },
  { name: "Coupon", path: "/coupon", icon: "🎄" },
  {
    name: "Marketing",
    icon: "",
    path: "/marketing",
    child: [
      {
        name: "Create Automation",
        icon: "➕",
        path: "/marketing/createAutomation",
      },
      { name: "Automations", icon: "🤖", path: "/marketing/automation" },
      { name: "Contact List", icon: "➕", path: "/marketing/contactList" },
      { name: "Contact", icon: "➕", path: "/marketing/contact" },
      { name: "Email Template", icon: "➕", path: "/marketing/template/email" },
      {
        name: "Whatsapp Message Template",
        icon: "➕",
        path: "/marketing/template/whatsappMessage",
      },
    ],
  },
  {
    name: "Whatsapp",
    icon: "",
    path: "/whatsapp",
    child: [
      { name: "Chats", icon: "💬", path: "/whatsapp/chat" },
      { name: "Templates", icon: "💬", path: "/whatsapp/template" },
    ],
  },
];
const renderMenu = (
  items: any[],
  activeLink: string,
  setActiveLink: (path: string) => void,
  navigate: (path: string) => void,
  setMenuOpen: (open: boolean) => void,
  level: number = 0 // nesting level
): any => {
  return (
    <ul
      style={{
        listStyle: "none",
        paddingLeft: level === 0 ? 0 : "1.5rem",
        margin: 0,
      }}
    >
      {items.map(({ name, icon, path, child }) => {
        const isActive = activeLink === path;
        const fontSize = level === 0 ? "0.8rem" : "0.75rem";
        const iconSize = level === 0 ? "1.3rem" : "1rem";

        return (
          <li key={name}>
            <div
              tabIndex={0}
              role="button"
              aria-pressed="false"
              style={{
                padding: "0.5rem",
                marginBottom: "0.1rem",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                fontSize,
                transition: "background-color 0.25s ease",
                userSelect: "none",
                backgroundColor: isActive ? "#f5891e" : "transparent",
              }}
              onClick={() => {
                setMenuOpen(false);
                if (name === "SignOut") {
                  Cookies.remove("authToken");
                  navigate("/login");
                } else if (path) {
                  setActiveLink(path);
                  navigate("/dashboard" + path);
                }
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5891e")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = isActive
                  ? "#f5891e"
                  : "transparent")
              }
              onFocus={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5891e")
              }
              onBlur={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <span
                style={{
                  marginRight: "0.6rem",
                  fontSize: iconSize,
                  lineHeight: 1,
                  userSelect: "none",
                }}
                aria-hidden="true"
              >
                {icon}
              </span>
              {name}
            </div>

            {/* Render children recursively */}
            {child &&
              renderMenu(
                child,
                activeLink,
                setActiveLink,
                navigate,
                setMenuOpen,
                level + 1
              )}
          </li>
        );
      })}
    </ul>
  );
};

const Dashboard: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pageName, setPageName] = useState("Dashboard");
  const [activeLink, setActiveLink] = useState("");
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen((open) => !open);
  const findMatchedLink = (items: typeof menuItems, path: string): any => {
    for (const item of items) {
      if (item.path === path) return item;
      if (item.child) {
        const matchedChild = findMatchedLink(item.child, path);
        if (matchedChild) return matchedChild;
      }
    }
    return null;
  };

  useEffect(() => {
    const currentPath = location.pathname;
    const currentSubPath = currentPath.split("dashboard")[1]; // e.g., "/automation/create"
    const matchedLink = findMatchedLink(menuItems, currentSubPath);

    if (matchedLink) {
      console.log(currentPath, "A", currentPath.split("dashboard")[1]);
      setActiveLink(matchedLink.path);
      setPageName(matchedLink.name);
      document.title = `${matchedLink.name} - Orderz Up`; // Dynamically update the title
    } else {
      document.title = "Dashboard - Orderz Up"; // Default title
    }
  }, [location.pathname]);

  return (
    <>
      <div
        style={{
          display: "flex",
          height: "100vh",
          width: "100vw", // full viewport width
          fontFamily: "'Poppins', sans-serif",
          backgroundColor: "#f0f2f5",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        {/* Sidebar */}
        {menuOpen && (
          <nav
            aria-label="Admin sidebar menu"
            style={{
              width: sidebarWidth,
              background: "linear-gradient(180deg, #000434 0%, #0d1446 100%)",
              color: "#fff",
              padding: "0.6rem",
              position: "fixed",
              top: 0,
              left: menuOpen ? 0 : -sidebarWidth,
              height: "100%",
              overflowY: "auto",
              boxShadow: "4px 0 15px rgba(0,0,0,0.4)",
              transition: "left 0.35s cubic-bezier(0.4,0,0.2,1)",
              zIndex: 1200,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Logo / Header */}
            <div
              style={{
                fontWeight: "700",
                fontSize: "1.75rem",
                marginBottom: "2rem",
                letterSpacing: "0.1em",
                userSelect: "none",
              }}
            >
              <span style={{ color: "#F5891E" }}>Orderz</span>Up
            </div>

            {/* Menu Items */}
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                flexGrow: 1,
              }}
            >
              {renderMenu(
                menuItems,
                activeLink,
                setActiveLink,
                navigate,
                setMenuOpen
              )}
            </ul>

            {/* Footer / Version or Logout could go here */}
            <div
              style={{
                fontSize: "0.85rem",
                color: "#bbb",
                textAlign: "center",
                marginTop: "auto",
                userSelect: "none",
              }}
            >
              © 2025 OrderzUp
            </div>
          </nav>
        )}

        {/* Overlay */}
        {menuOpen && (
          <div
            onClick={toggleMenu}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(2px)",
              zIndex: 1100,
              cursor: "pointer",
            }}
            aria-hidden="true"
          />
        )}

        {/* Main content */}
        <main
          style={{
            flexGrow: 1,
            marginLeft: menuOpen ? sidebarWidth : 0,
            height: "100vh",
            overflowY: "auto",
            backgroundColor: "#fff",
            boxShadow: menuOpen ? "-8px 0 15px rgba(0, 0, 0, 0.1)" : "none",
            transition:
              "margin-left 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s ease",
          }}
        >
          {/* Burger toggle button */}
          <header
            style={{
              height: 60,
              backgroundColor: "#000434",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              padding: "0 1.5rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              position: "relative",
              zIndex: 1000,
            }}
          >
            {/* Burger toggle button */}
            <button
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={toggleMenu}
              style={{
                backgroundColor: "#F5891E",
                border: "none",
                borderRadius: "50%",
                width: 40,
                height: 40,
                color: "#fff",
                fontSize: "16px",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(245, 137, 30, 0.6)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                userSelect: "none",
                fontWeight: "bolder",
              }}
            >
              {menuOpen ? "×" : "☰"}
            </button>
            <div
              style={{
                marginLeft: 20,
                flexDirection: "column",
                alignItems: "baseline",
                display: "flex",
              }}
            >
              {/* Title or logo can go here */}
              <h1
                style={{
                  fontWeight: "normal",
                  fontSize: "1.25rem",
                  marginBottom: 0,
                }}
              >
                {pageName}
              </h1>
              <span style={{ fontSize: 12 }}>/dashboard{activeLink}</span>
            </div>
          </header>

          {/* Outlet for nested routes */}
          <Outlet />
        </main>
      </div>

      {/* Responsive styles */}
      <style>{`
          nav {
             left: ${menuOpen ? "0" : "-${sidebarWidth}px"};
          }
         
          button {
            left: 20px !important;
          }
        
          #root {
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
  box-sizing: border-box;
}

      `}</style>
    </>
  );
};

export default Dashboard;
