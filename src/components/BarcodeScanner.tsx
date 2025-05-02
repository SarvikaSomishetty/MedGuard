import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import Quagga from 'quagga';
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface BarcodeScannerProps {
  onResult: (result: { status: 'real' | 'fake' | 'suspicious' | null; details: any }) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onResult }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    if (isScanning) {
      Quagga.init({
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: webcamRef.current?.video,
          constraints: {
            facingMode: 'environment',
          },
        },
        decoder: {
          readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'upc_reader', 'upc_e_reader'],
        },
      }, (err) => {
        if (err) {
          setError('Failed to initialize scanner');
          console.error(err);
          return;
        }
        Quagga.start();
      });

      Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        // Here you would typically call your API to verify the medicine
        verifyMedicine(code);
      });
    }

    return () => {
      Quagga.stop();
    };
  }, [isScanning]);

  const verifyMedicine = async (code: string) => {
    try {
      // Update the API URL to point to your local backend
      const response = await fetch(`http://localhost:3001/api/verify?code=${code}`);
      const data = await response.json();
      
      onResult({
        status: data.status,
        details: data.details,
      });
    } catch (err) {
      setError('Failed to verify medicine');
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Scan Medicine Barcode</h2>
        <button
          onClick={() => setIsScanning(!isScanning)}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            isScanning ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          {isScanning ? (
            <>
              <XMarkIcon className="h-5 w-5 mr-2" />
              Stop Scanning
            </>
          ) : (
            <>
              <CameraIcon className="h-5 w-5 mr-2" />
              Start Scanning
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 border-4 border-primary-500 rounded-lg" />
        </div>
      )}

      {!isScanning && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No camera active</h3>
          <p className="mt-1 text-sm text-gray-500">
            Click 'Start Scanning' to begin scanning medicine barcodes.
          </p>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner; 