import React, { useState } from "react";
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
} from "lucide-react";

const Sidebar = () => {
  const history = useHistory();
  const location = useLocation();

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
      // Handle logout logic here
      console.log("Logout clicked");
      // You might want to clear user session, redirect to login, etc.
      return;
    }

    setActiveItem(item.id);
    if (item.path) {
      history.push(item.path);
    }
  };

  // Update active item when route changes
  React.useEffect(() => {
    setActiveItem(getActiveItem());
  }, [location.pathname]);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed left-0 top-0 h-full z-10">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold mr-2">
            GO
          </div>
          <span className="text-xl font-semibold">DataBoard</span>
        </div>
      </div>

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
    </aside>
  );
};

export default Sidebar;
