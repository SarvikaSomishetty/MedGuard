import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface MedicineSearchProps {
  onResult: (result: { status: 'real' | 'fake' | 'suspicious' | null; details: any }) => void;
}

const searchSchema = z.object({
  medicineName: z.string().min(1, 'Medicine name is required'),
});

type SearchFormData = z.infer<typeof searchSchema>;

const MedicineSearch: React.FC<MedicineSearchProps> = ({ onResult }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
  });

  const onSubmit = async (data: SearchFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Update the API URL to point to your local backend
      const response = await fetch(`http://localhost:3001/api/search?name=${encodeURIComponent(data.medicineName)}`);
      const result = await response.json();

      onResult({
        status: result.status,
        details: result.details,
      });
    } catch (err) {
      setError('Failed to search for medicine');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Search Medicine by Name</h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter the name of the medicine to verify its authenticity.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="medicineName" className="block text-sm font-medium text-gray-700">
            Medicine Name
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              id="medicineName"
              {...register('medicineName')}
              className={`block w-full rounded-md ${
                errors.medicineName
                  ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              } sm:text-sm`}
              placeholder="Enter medicine name"
            />
          </div>
          {errors.medicineName && (
            <p className="mt-2 text-sm text-red-600">{errors.medicineName.message}</p>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {isLoading ? (
            'Searching...'
          ) : (
            <>
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              Search
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default MedicineSearch; 