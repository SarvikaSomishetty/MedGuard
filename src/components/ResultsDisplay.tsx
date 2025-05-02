import React from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface ResultsDisplayProps {
  result: {
    status: 'real' | 'fake' | 'suspicious' | null;
    details: any;
  };
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  const getStatusIcon = () => {
    switch (result.status) {
      case 'real':
        return (
          <CheckCircleIcon className="h-6 w-6 text-success-500" aria-hidden="true" />
        );
      case 'fake':
        return (
          <XCircleIcon className="h-6 w-6 text-danger-500" aria-hidden="true" />
        );
      case 'suspicious':
        return (
          <ExclamationTriangleIcon
            className="h-6 w-6 text-warning-500"
            aria-hidden="true"
          />
        );
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (result.status) {
      case 'real':
        return 'This medicine appears to be authentic.';
      case 'fake':
        return 'Warning: This medicine may be counterfeit.';
      case 'suspicious':
        return 'This medicine requires further verification.';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (result.status) {
      case 'real':
        return 'bg-success-50 text-success-800';
      case 'fake':
        return 'bg-danger-50 text-danger-800';
      case 'suspicious':
        return 'bg-warning-50 text-warning-800';
      default:
        return '';
    }
  };

  return (
    <div className="rounded-md p-4">
      <div className="flex">
        <div className="flex-shrink-0">{getStatusIcon()}</div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusMessage()}
          </h3>
          {result.details && (
            <div className="mt-2 text-sm text-gray-700">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                {Object.entries(result.details).map(([key, value]) => (
                  <div key={key} className="sm:col-span-1">
                    <dt className="font-medium text-gray-500">{key}</dt>
                    <dd className="mt-1 text-gray-900">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay; 