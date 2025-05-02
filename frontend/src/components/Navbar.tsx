import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, CameraIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-primary-600">
              Medicine Verifier
            </Link>
          </div>
          
          <div className="flex space-x-4">
            <Link
              to="/"
              className="flex items-center px-3 py-2 text-gray-700 hover:text-primary-600"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Home
            </Link>
            <Link
              to="/verify"
              className="flex items-center px-3 py-2 text-gray-700 hover:text-primary-600"
            >
              <CameraIcon className="h-5 w-5 mr-2" />
              Verify
            </Link>
            <Link
              to="/history"
              className="flex items-center px-3 py-2 text-gray-700 hover:text-primary-600"
            >
              <ClockIcon className="h-5 w-5 mr-2" />
              History
            </Link>
            <Link
              to="/login"
              className="flex items-center px-3 py-2 text-gray-700 hover:text-primary-600"
            >
              <UserIcon className="h-5 w-5 mr-2" />
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 