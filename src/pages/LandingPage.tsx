import React from "react";
import { Link } from "react-router-dom";
import {
  BarChart3Icon,
  UsersIcon,
  ClipboardCheckIcon,
  ArrowRightIcon,
} from "lucide-react";
const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      {/* <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold mr-2">
                DB
              </div>
              <span className="text-xl font-semibold text-gray-900">
                DataBoard
              </span>
            </div>
            <div className="flex items-center">
              <Link
                to="/dashboard"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </nav> */}
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
                Farm Worker Management System
              </h1>
              <p className="mt-4 text-xl text-gray-600 max-w-3xl">
                Efficiently track worker assignments, monitor progress, and
                manage farm operations in real-time.
              </p>
              <div className="mt-8">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Dashboard
                  <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5" />
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
                alt="Farm management"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Streamline Your Farm Operations
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Our platform provides everything you need to manage your farm
              workforce efficiently.
            </p>
          </div>
          <div className="mt-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="bg-blue-100 rounded-lg p-3 inline-block">
                  <UsersIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Worker Management
                </h3>
                <p className="mt-2 text-gray-600">
                  Assign workers to specific blocks and rows, track their
                  progress, and manage job types efficiently.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="bg-blue-100 rounded-lg p-3 inline-block">
                  <ClipboardCheckIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Progress Tracking
                </h3>
                <p className="mt-2 text-gray-600">
                  Monitor work progress in real-time with visual indicators and
                  detailed stock management.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="bg-blue-100 rounded-lg p-3 inline-block">
                  <BarChart3Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Data Analytics
                </h3>
                <p className="mt-2 text-gray-600">
                  Gain insights into productivity, resource allocation, and
                  operational efficiency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Stats Section */}
      <div className="bg-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Trusted by Farm Operations Worldwide
            </h2>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <span className="text-4xl font-extrabold text-blue-600">
                500+
              </span>
              <p className="mt-2 text-lg font-medium text-gray-900">Farms</p>
            </div>
            <div className="text-center">
              <span className="text-4xl font-extrabold text-blue-600">
                10k+
              </span>
              <p className="mt-2 text-lg font-medium text-gray-900">Workers</p>
            </div>
            <div className="text-center">
              <span className="text-4xl font-extrabold text-blue-600">98%</span>
              <p className="mt-2 text-lg font-medium text-gray-900">
                Satisfaction
              </p>
            </div>
            <div className="text-center">
              <span className="text-4xl font-extrabold text-blue-600">
                24/7
              </span>
              <p className="mt-2 text-lg font-medium text-gray-900">Support</p>
            </div>
          </div>
        </div>
      </div>
      {/* CTA Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-12 md:py-16 md:px-12 text-center md:text-left">
              <div className="md:flex md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    Ready to optimize your farm operations?
                  </h2>
                  <p className="mt-3 max-w-3xl text-lg text-blue-100">
                    Get started with our dashboard today and see the difference
                    in efficiency and productivity.
                  </p>
                </div>
                <div className="mt-8 md:mt-0">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      {/* <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold mr-2">
                DB
              </div>
              <span className="text-lg font-semibold text-gray-900">
                DataBoard
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2023 DataBoard. All rights reserved.
            </p>
          </div>
        </div>
      </footer> */}
    </div>
  );
};
export default LandingPage;
