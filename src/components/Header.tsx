// src/components/Header.tsx
import React from "react";
import { IonHeader, IonToolbar, IonTitle } from "@ionic/react";
import { motion } from "framer-motion";

const Header: React.FC = () => {
  return (
    <header className="bg-gray-100 shadow relative">
      <div className="container mx-auto">
        <motion.div
          className="flex items-center space-x-2 px-4 py-3 md:px-4"
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
          {/* Mobile: Add left padding to account for hamburger button */}
          <div className="pl-16 md:pl-0 flex items-center space-x-2">
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
            <h1 className="text-lg font-semibold text-black">
              Farm Management
            </h1>
          </div>

          <div className="flex-grow"></div>

          {/* Desktop navigation - hidden on mobile */}
          <div className="hidden md:flex space-x-6 mr-4">
            <div className="text-green-600 font-medium">Dashboard</div>
            {/* <div className="text-gray-500 font-medium">Workers</div>
            <div className="text-gray-500 font-medium">Reports</div> */}
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
