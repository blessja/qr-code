import React, { useState } from 'react';
import { HomeIcon, BarChart3Icon, UsersIcon, SettingsIcon, HelpCircleIcon, LogOutIcon, LayoutDashboardIcon, FolderIcon } from 'lucide-react';
const Sidebar = () => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const menuItems = [{
    id: 'dashboard',
    icon: <LayoutDashboardIcon size={20} />,
    label: 'Dashboard'
  }, {
    id: 'analytics',
    icon: <BarChart3Icon size={20} />,
    label: 'Analytics'
  }, {
    id: 'workers',
    icon: <UsersIcon size={20} />,
    label: 'Workers'
  }, {
    id: 'blocks',
    icon: <FolderIcon size={20} />,
    label: 'Blocks'
  }];
  const bottomMenuItems = [{
    id: 'settings',
    icon: <SettingsIcon size={20} />,
    label: 'Settings'
  }, {
    id: 'help',
    icon: <HelpCircleIcon size={20} />,
    label: 'Help'
  }, {
    id: 'logout',
    icon: <LogOutIcon size={20} />,
    label: 'Logout'
  }];
  const handleItemClick = (id: string) => {
    setActiveItem(id);
  };
  return <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold mr-2">
            DB
          </div>
          <span className="text-xl font-semibold">DataBoard</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2">
          <div className="space-y-1">
            {menuItems.map(item => <button key={item.id} className={`flex items-center w-full px-3 py-2 text-left text-sm rounded-md transition-colors ${activeItem === item.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => handleItemClick(item.id)}>
                <span className={`mr-3 ${activeItem === item.id ? 'text-blue-600' : 'text-gray-500'}`}>
                  {item.icon}
                </span>
                {item.label}
              </button>)}
          </div>
        </nav>
      </div>
      <div className="p-4 border-t border-gray-200">
        <nav className="px-2">
          <div className="space-y-1">
            {bottomMenuItems.map(item => <button key={item.id} className="flex items-center w-full px-3 py-2 text-left text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors" onClick={() => handleItemClick(item.id)}>
                <span className="mr-3 text-gray-500">{item.icon}</span>
                {item.label}
              </button>)}
          </div>
        </nav>
      </div>
    </aside>;
};
export default Sidebar;