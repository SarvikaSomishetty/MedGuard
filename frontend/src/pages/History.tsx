import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

const History: React.FC = () => {
  // This will be replaced with actual data from the backend
  const mockHistory = [
    {
      id: 1,
      name: 'Paracetamol 500mg',
      date: '2024-04-25',
      status: 'real',
      code: '123456789012'
    },
    {
      id: 2,
      name: 'Ibuprofen 200mg',
      date: '2024-04-24',
      status: 'suspicious',
      code: '987654321098'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Verification History</h1>
        <p className="text-gray-600">View your past medicine verifications</p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {mockHistory.map((item) => (
            <li key={item.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">Code: {item.code}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.status === 'real'
                      ? 'bg-green-100 text-green-800'
                      : item.status === 'suspicious'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 inline-block mr-1" />
                    {item.date}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default History; 