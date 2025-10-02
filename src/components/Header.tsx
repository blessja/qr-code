// src/components/Header.tsx
import React from "react";
import { IonHeader, IonToolbar, IonTitle } from "@ionic/react";
import { motion } from "framer-motion";
import { useHistory } from "react-router-dom";
import { LogIn, LogOut } from "lucide-react";

const Header: React.FC = () => {
  const history = useHistory();

  return (
    <header className="bg-gray-100 shadow relative">
      <div className="container mx-auto">
        <motion.div
          className="flex items-center justify-between px-4 py-3 md:px-4"
          initial={{
            opacity: 0,
            y: -20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
        >
          {/* Left: Logo and Title */}
          <div className="flex items-center space-x-2 pl-12 md:pl-0">
            <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
                />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-black hidden sm:block">
              Farm Management
            </h1>
            <h1 className="text-sm font-semibold text-black sm:hidden">
              Farm Mgmt
            </h1>
          </div>

          {/* Right: Check-in and Check-out Buttons */}
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => history.push("/checkin")}
              className="flex items-center space-x-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-colors duration-200 text-sm font-medium"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Check-in</span>
              <span className="sm:hidden">In</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => history.push("/checkout")}
              className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors duration-200 text-sm font-medium"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Check-out</span>
              <span className="sm:hidden">Out</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
