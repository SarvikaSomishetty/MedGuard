import React, { useState } from 'react';
import { CameraIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import BarcodeScanner from './components/BarcodeScanner';
import MedicineSearch from './components/MedicineSearch';
import ResultsDisplay from './components/ResultsDisplay';

function App() {
  const [activeTab, setActiveTab] = useState<'scan' | 'search'>('scan');
  const [verificationResult, setVerificationResult] = useState<{
    status: 'real' | 'fake' | 'suspicious' | null;
    details: any;
  }>({ status: null, details: null });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-primary-600">MediCheck</span>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('scan')}
                className={`${
                  activeTab === 'scan'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <CameraIcon className="h-5 w-5 mr-2" />
                Scan Barcode
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`${
                  activeTab === 'search'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                Search by Name
              </button>
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === 'scan' ? (
              <BarcodeScanner onResult={setVerificationResult} />
            ) : (
              <MedicineSearch onResult={setVerificationResult} />
            )}
          </div>

          {verificationResult.status && (
            <div className="mt-6">
              <ResultsDisplay result={verificationResult} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App; 