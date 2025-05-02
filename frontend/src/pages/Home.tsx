import React from 'react';
import { Link } from 'react-router-dom';
import { CameraIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const Home: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Medicine Verifier
        </h1>
        <p className="text-xl text-gray-600">
          Verify the authenticity of your medicines using barcode scanning or manual search
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/verify"
          className="group p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg mr-4">
              <CameraIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600">
                Scan Barcode
              </h2>
              <p className="text-gray-600">
                Use your camera to scan medicine barcodes
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/verify"
          className="group p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg mr-4">
              <MagnifyingGlassIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600">
                Search Manually
              </h2>
              <p className="text-gray-600">
                Search for medicines by name or code
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Home; 