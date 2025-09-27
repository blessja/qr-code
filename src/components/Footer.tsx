import React from "react";
import { motion } from "framer-motion";
export function Footer() {
  return (
    <footer className="bg-gray-100 shadow-inner">
      <motion.div
        className="container mx-auto py-3 px-4 text-sm text-gray-500 flex flex-col md:flex-row justify-between items-center"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          delay: 0.5,
          duration: 0.5,
        }}
      >
        <p>© 2023 Farm Management System</p>
        <div className="flex space-x-4 mt-2 md:mt-0">
          <a href="#" className="hover:text-green-600 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-green-600 transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-green-600 transition-colors">
            Contact
          </a>
        </div>
      </motion.div>
    </footer>
  );
}
