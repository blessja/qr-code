import React, { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  HomeIcon,
  BarChart3Icon,
  UsersIcon,
  SettingsIcon,
  HelpCircleIcon,
  LogOutIcon,
  LayoutDashboardIcon,
  FolderIcon,
  ClockIcon,
  UserCheckIcon,
  UserXIcon,
  MenuIcon,
  XIcon,
} from "lucide-react";

const Sidebar = () => {
  const history = useHistory();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Determine active item based on current route
  const getActiveItem = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "dashboard";
    if (path === "/home") return "home";
    if (path === "/checkin") return "checkin";
    if (path === "/checkout") return "checkout";
    if (path === "/workerTotalsPage") return "workerTotalsPage";
    if (path === "/monitor-clockins") return "monitor";
    if (path === "/clocks") return "clocks";
    if (path.includes("/piecework")) return "piecework";
    return "dashboard";
  };

  const [activeItem, setActiveItem] = useState(getActiveItem());

  const menuItems = [
    {
      id: "dashboard",
      icon: <LayoutDashboardIcon size={20} />,
      label: "Current Check-Ins",
      path: "/dashboard",
    },
    {
      id: "home",
      icon: <HomeIcon size={20} />,
      label: "Home",
      path: "/home",
    },
    {
      id: "checkin",
      icon: <UserCheckIcon size={20} />,
      label: "Check In",
      path: "/checkin",
    },
    {
      id: "checkout",
      icon: <UserXIcon size={20} />,
      label: "Check Out",
      path: "/checkout",
    },
    {
      id: "workerTotalsPage",
      icon: <UserCheckIcon size={20} />,
      label: "Worker Totals",
      path: "/workerTotalsPage",
    },
    {
      id: "monitor",
      icon: <ClockIcon size={20} />,
      label: "Monitor Clock",
      path: "/monitor-clockins",
    },
    {
      id: "clocks",
      icon: <BarChart3Icon size={20} />,
      label: "Clock Dashboard",
      path: "/clocks",
    },
    {
      id: "piecework",
      icon: <FolderIcon size={20} />,
      label: "Piece Work",
      path: "/piecework_1",
    },
  ];

  const bottomMenuItems = [
    {
      id: "settings",
      icon: <SettingsIcon size={20} />,
      label: "Settings",
      path: "/settings",
    },
    {
      id: "help",
      icon: <HelpCircleIcon size={20} />,
      label: "Help",
      path: "/help",
    },
    {
      id: "logout",
      icon: <LogOutIcon size={20} />,
      label: "Logout",
      action: "logout",
    },
  ];

  const handleItemClick = (item: any) => {
    if (item.action === "logout") {
      console.log("Logout clicked");
      setIsMobileMenuOpen(false);
      return;
    }

    setActiveItem(item.id);
    setIsMobileMenuOpen(false); // Close mobile menu when item is clicked
    if (item.path) {
      history.push(item.path);
    }
  };

  // Update active item when route changes
  useEffect(() => {
    setActiveItem(getActiveItem());
  }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("mobile-sidebar");
      const hamburger = document.getElementById("hamburger-button");

      if (
        isMobileMenuOpen &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        hamburger &&
        !hamburger.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const renderMenuItems = () => (
    <>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`flex items-center w-full px-3 py-2 text-left text-sm rounded-md transition-colors ${
                  activeItem === item.id
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => handleItemClick(item)}
              >
                <span
                  className={`mr-3 ${
                    activeItem === item.id ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200">
        <nav className="px-2">
          <div className="space-y-1">
            {bottomMenuItems.map((item) => (
              <button
                key={item.id}
                className="flex items-center w-full px-3 py-2 text-left text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                onClick={() => handleItemClick(item)}
              >
                <span className="mr-3 text-gray-500">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        id="hamburger-button"
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <XIcon size={24} className="text-gray-600" />
        ) : (
          <MenuIcon size={24} className="text-gray-600" />
        )}
      </button>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed left-0 top-0 h-full z-10">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold mr-2">
              GO
            </div>
            <span className="text-xl font-semibold">DataBoard</span>
          </div>
        </div>
        {renderMenuItems()}
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" />
      )}

      {/* Mobile Sidebar */}
      <aside
        id="mobile-sidebar"
        className={`md:hidden fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200 mt-12">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold mr-2">
              GO
            </div>
            <span className="text-xl font-semibold">DataBoard</span>
          </div>
        </div>
        {renderMenuItems()}
      </aside>
    </>
  );
};

export default Sidebar;
