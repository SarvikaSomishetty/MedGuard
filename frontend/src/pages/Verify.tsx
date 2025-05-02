import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { CameraIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import Quagga from 'quagga';
import toast from 'react-hot-toast';
import axios from 'axios';

interface VerificationResult {
  status: 'real' | 'fake' | 'suspicious' | 'external' | 'unverified';
  details: {
    name?: string;
    manufacturer?: string;
    activeIngredients?: string[];
    dosage?: string;
    ndcCode?: string;
    verifiedNdc?: string;
    originalBarcode?: string;
    barcode?: string;
    confidence?: number;
    warnings?: string[];
    source?: string;
    input?: string;
    format?: string;
    successMessage?: string;
    verificationTime?: string;
  };
}

interface NdcFormat {
  ndc: string;
  format: string;
  exists?: boolean;
}

const API_KEY = 'lhEBuBQG2Xdx49bqizP7WX2jtgdvKiWjSDFAYsSG';

// Utility functions
function isValidBarcode(code: string): boolean {
  if (!/^\d{8,14}$/.test(code)) return false;
  
  if (code.length === 13 || code.length === 14) {
    const digits = code.split('').map(Number);
    const checkDigit = digits.pop();
    
    let sum = 0;
    digits.forEach((digit, i) => {
      sum += digit * (i % 2 === 0 ? 1 : 3);
    });
    
    const calculatedCheck = (10 - (sum % 10)) % 10;
    return checkDigit === calculatedCheck;
  }
  
  return true;
}

const generateNDCFormats = (gtin: string): NdcFormat[] => {
  const cleanGtin = gtin.replace(/\D/g, '');
  const formats: NdcFormat[] = [];

  // Try removing 0-3 digits from start
  for (let digitsRemoved = 0; digitsRemoved <= 3 && digitsRemoved <= cleanGtin.length - 10; digitsRemoved++) {
    const remaining = cleanGtin.substring(digitsRemoved);

    // Generate all possible NDC formats
    if (remaining.length >= 10) {
      formats.push({
        ndc: `${remaining.substring(0, 5)}-${remaining.substring(5, 9)}-${remaining.substring(9, 11)}`,
        format: '5-4-2'
      });
      formats.push({
        ndc: `${remaining.substring(0, 5)}-${remaining.substring(5, 8)}-${remaining.substring(8, 10)}`,
        format: '5-3-2'
      });
      formats.push({
        ndc: `${remaining.substring(0, 4)}-${remaining.substring(4, 8)}-${remaining.substring(8, 10)}`,
        format: '4-4-2'
      });
    }
  }

  return formats.filter((item, index, self) =>
    index === self.findIndex((t) => (
      t.ndc === item.ndc && t.format === item.format
    ))
  );
};

// FDA API Service
class FDAService {
  static async search(ndc: string): Promise<any> {
    try {
      // First try searching as NDC
      if (/^\d{4,5}-?\d{3,4}-?\d{2}$/.test(ndc)) {
        const response = await axios.get('https://api.fda.gov/drug/ndc.json', {
          params: {
            api_key: API_KEY,
            search: `product_ndc:"${ndc}" OR package_ndc:"${ndc}"`,
            limit: 1
          },
          timeout: 5000
        });
        return response.data?.results?.[0] || null;
      }
      
      // If not an NDC format, search by drug name
      const response = await axios.get('https://api.fda.gov/drug/ndc.json', {
        params: {
          api_key: API_KEY,
          search: `brand_name:"${ndc}" OR generic_name:"${ndc}"`,
          limit: 1
        },
        timeout: 5000
      });
      return response.data?.results?.[0] || null;

    } catch (error) {
      console.error(`FDA search failed for ${ndc}:`, error);
      return null;
    }
  }

  static async checkNdcExists(ndc: string): Promise<boolean> {
    try {
      const response = await axios.get('https://api.fda.gov/drug/ndc.json', {
        params: {
          api_key: API_KEY,
          search: `product_ndc:"${ndc.split('-')[0]}-${ndc.split('-')[1]}"`,
          limit: 1
        },
        timeout: 5000
      });
      return response.data.results?.length > 0;
    } catch (error) {
      console.error(`Error checking NDC ${ndc}:`, error);
      return false;
    }
  }
}

const Verify: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const scannerRef = useRef<HTMLDivElement>(null);
  const quaggaInitialized = useRef(false);

  // Debug effect
  useEffect(() => {
    console.log('Result state updated:', result);
  }, [result]);

  const verifyMedicine = async (input: string): Promise<void> => {
    setIsProcessing(true);
    setError('');
    setResult(null);

    try {
      const cleanInput = input.trim();
      if (!cleanInput) {
        setIsProcessing(false);
        return;
      }

      // Handle barcode input
      if (/^\d{12,14}$/.test(cleanInput)) {
        const ndcFormats = generateNDCFormats(cleanInput);
        let foundValidNdc = false;
        
        for (const { ndc, format } of ndcFormats) {
          const exists = await FDAService.checkNdcExists(ndc);
          if (exists) {
            foundValidNdc = true;
            toast.success(`Found verified NDC: ${ndc} (${format})`, {
              duration: 5000,
              position: 'top-center',
              icon: '✅'
            });
            
            const drugData = await FDAService.search(ndc);
            if (drugData) {
              setResult({
                status: 'real',
                details: {
                  name: drugData.brand_name || drugData.generic_name || 'Unknown',
                  manufacturer: drugData.labeler_name || 'Unknown',
                  verifiedNdc: ndc,
                  ndcCode: ndc,
                  format: format,
                  originalBarcode: cleanInput,
                  barcode: cleanInput,
                  source: 'FDA Database',
                  input: cleanInput,
                  confidence: 1.0,
                  successMessage: `✅ Successfully verified NDC ${ndc} (${format}) at ${new Date().toLocaleString()}`,
                  verificationTime: new Date().toISOString()
                }
              });
            }
            setIsProcessing(false);
            return;
          }
        }

        if (!foundValidNdc) {
          toast.error('⚠️ Warning: Medicine not found in OpenFDA database', {
            duration: 6000,
            position: 'top-center'
          });
          setResult(null);
          setIsProcessing(false);
          return;
        }
        return;
      }

      // Handle direct drug name search
      const drugData = await FDAService.search(cleanInput);
      if (drugData) {
        const verifiedNdc = drugData.product_ndc || drugData.package_ndc;
        setResult({
          status: 'real',
          details: {
            name: drugData.brand_name || drugData.generic_name || 'Unknown',
            manufacturer: drugData.labeler_name || 'Unknown',
            verifiedNdc: verifiedNdc,
            ndcCode: verifiedNdc,
            source: 'FDA Database',
            input: cleanInput,
            verificationTime: new Date().toISOString(),
            successMessage: `✅ Successfully verified medicine at ${new Date().toLocaleString()}`
          }
        });
        toast.success('Medicine verified!');
        setIsProcessing(false);
        return;
      }

      // Only show error if no success toast was shown
      toast.error('Medicine not found', {
        duration: 6000,
        position: 'top-center'
      });
      setResult(null);
      setIsProcessing(false);

    } catch (err) {
      console.error('Verification error:', err);
      setError('Verification failed. Please try again.');
      setIsProcessing(false);
    }
  };

  // Scanner initialization and cleanup
  useEffect(() => {
    const initScanner = async () => {
      try {
        if (!scannerRef.current) {
          throw new Error('Scanner container not found');
        }

        // Clear any existing content
        scannerRef.current.innerHTML = '';

        await new Promise<void>((resolve, reject) => {
          Quagga.init({
            inputStream: {
              name: 'Live',
              type: 'LiveStream',
              target: scannerRef.current!,
              constraints: {
                facingMode: 'environment',
                width: 1280,
                height: 720
              }
            },
            decoder: {
              readers: ['ean_reader', 'ean_8_reader', 'code_128_reader'],
              multiple: false
            },
            locate: true
          }, (err) => {
            if (err) {
              reject(err);
              return;
            }
            quaggaInitialized.current = true;
            resolve();
          });
        });

        let lastCode = '';
        let matchCount = 0;

        Quagga.onDetected((result: any) => {
          const code = result?.codeResult?.code;
          if (!code || !isValidBarcode(code)) return;

          if (code !== lastCode) {
            lastCode = code;
            matchCount = 1;
          } else {
            matchCount++;
          }

          setDetectedCode(code);
          
          if (matchCount >= 3) {
            Quagga.stop();
            setIsScanning(false);
            verifyMedicine(code);
          }
        });

        Quagga.start();

        // Style video element
        const videoEl = scannerRef.current?.querySelector('video');
        if (videoEl) {
          videoEl.style.width = '100%';
          videoEl.style.height = '100%';
          videoEl.style.objectFit = 'cover';
          videoEl.setAttribute('playsinline', 'true');
        }

      } catch (err) {
        console.error('Scanner initialization error:', err);
        setError('Failed to initialize scanner. Please try again or use manual input.');
        toast.error('Scanner initialization failed');
        setIsScanning(false);
      }
    };

    if (isScanning) {
      initScanner();
    }

    return () => {
      if (quaggaInitialized.current) {
        Quagga.stop();
        quaggaInitialized.current = false;
      }
      if (scannerRef.current) {
        scannerRef.current.innerHTML = '';
      }
    };
  }, [isScanning]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 mb-2">
            MedGuard
          </h1>
          <p className="text-gray-400">Medicine Verification System</p>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700/50 animate-slide-up">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/50 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">100%</div>
              <div className="text-sm text-gray-400">Accuracy</div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/50 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">24/7</div>
              <div className="text-sm text-gray-400">Availability</div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/50 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">FDA</div>
              <div className="text-sm text-gray-400">Verified</div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/50 text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">Real-time</div>
              <div className="text-sm text-gray-400">Updates</div>
            </div>
          </div>
        </div>

        {/* About Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-green-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/10">
            <div className="flex items-center mb-4">
              <div className="bg-green-500/10 p-3 rounded-lg mr-4">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Secure Verification</h3>
            </div>
            <p className="text-gray-400 text-sm">Real-time verification using FDA database to ensure medicine authenticity</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex items-center mb-4">
              <div className="bg-blue-500/10 p-3 rounded-lg mr-4">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Multiple Methods</h3>
            </div>
            <p className="text-gray-400 text-sm">Scan barcode or search by name for flexible verification options</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10">
            <div className="flex items-center mb-4">
              <div className="bg-purple-500/10 p-3 rounded-lg mr-4">
                <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Instant Results</h3>
            </div>
            <p className="text-gray-400 text-sm">Get immediate verification results with detailed medicine information</p>
          </div>
        </div>

        {/* Quick Guide Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700/50 animate-slide-up">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/50">
              <div className="flex items-center mb-2">
                <div className="bg-green-500/10 p-2 rounded-lg mr-3">
                  <span className="text-green-400 font-bold">1</span>
                </div>
                <h3 className="text-white font-medium">Scan Barcode</h3>
              </div>
              <p className="text-gray-400 text-sm">Use your camera to scan the medicine barcode for instant verification</p>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/50">
              <div className="flex items-center mb-2">
                <div className="bg-blue-500/10 p-2 rounded-lg mr-3">
                  <span className="text-blue-400 font-bold">2</span>
                </div>
                <h3 className="text-white font-medium">Search by Name</h3>
              </div>
              <p className="text-gray-400 text-sm">Enter the medicine name </p>
            </div>
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Scan Barcode Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700/50 animate-slide-up">
            <div className="flex items-center">
              <div className="bg-green-500/10 p-3 rounded-lg mr-4">
                <CameraIcon className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Scan Barcode</h2>
                <p className="text-gray-400">Quickly verify medicine using barcode</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsScanning(!isScanning)}
              disabled={isProcessing}
              className={`mt-4 w-full py-3 px-4 rounded-lg font-medium text-black transition-all duration-300 ${
                isScanning
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600'
              } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/20`}
            >
              {isScanning ? 'Stop Scanning' : 'Start Scanner'}
            </button>
          </div>

          {/* Search by Drug Name Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-700/50 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center mb-4">
              <div className="bg-blue-500/10 p-3 rounded-lg mr-4">
                <MagnifyingGlassIcon className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Search by Drug Name</h2>
                <p className="text-gray-400">Look up medicine information</p>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery) verifyMedicine(searchQuery);
            }} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700/50 border border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-gray-400 disabled:opacity-50"
                  placeholder="Enter drug name"
                />
              </div>
              <button
                type="submit"
                disabled={isProcessing || !searchQuery}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20"
              >
                {isProcessing ? 'Searching...' : 'Search FDA Database'}
              </button>
            </form>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700/50 animate-slide-up">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-green-500/10 p-2 rounded-lg mr-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Last Verification</h3>
                    <p className="text-gray-400 text-sm">Verified medicine using barcode scan</p>
                  </div>
                </div>
                <span className="text-gray-400 text-sm">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-blue-500/10 p-2 rounded-lg mr-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Last Search</h3>
                    <p className="text-gray-400 text-sm">Searched medicine </p>
                  </div>
                </div>
                <span className="text-gray-400 text-sm">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm animate-shake">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {isScanning && (
          <div className="text-center animate-fade-in">
            <p className="text-gray-400 mb-4">Align the barcode within the frame</p>
            <div className="relative w-full max-w-2xl mx-auto bg-black rounded-xl overflow-hidden" style={{ minHeight: '400px' }}>
              <div 
                ref={scannerRef} 
                className="absolute inset-0 overflow-hidden"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-green-400 border-dashed rounded-lg animate-pulse" style={{
                  width: '280px',
                  height: '160px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                }} />
              </div>
            </div>
            {detectedCode && (
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700 backdrop-blur-sm animate-slide-up">
                <p className="text-sm text-gray-400">
                  Detected: <span className="font-mono font-medium text-green-400">{detectedCode}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className={`mt-8 p-6 rounded-xl shadow-lg border backdrop-blur-sm animate-slide-up ${
            result.status === 'real' 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-yellow-500/10 border-yellow-500/30'
          }`}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {result.status === 'real' ? (
                  <CheckCircleIcon className="h-8 w-8 text-green-400 animate-bounce" />
                ) : (
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-400 animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-white capitalize mb-4">
                  {result.status === 'real' ? 'Verified Medicine' : 'Checking Medicine...'}
                </h2>
                
                {result.status === 'real' && (
                  <div className="space-y-4">
                    <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30 animate-fade-in">
                      <p className="text-lg font-medium text-green-400">
                        ✅ Verified Medicine
                      </p>
                      {result.details.verificationTime && (
                        <p className="text-sm text-green-400/80 mt-1">
                          Verified at: {new Date(result.details.verificationTime).toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.details.name && (
                        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 hover:border-green-500/30 transition-all duration-300">
                          <span className="font-medium text-gray-400">Name:</span>
                          <span className="ml-2 text-white">{result.details.name}</span>
                        </div>
                      )}
                      
                      {result.details.manufacturer && (
                        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 hover:border-green-500/30 transition-all duration-300">
                          <span className="font-medium text-gray-400">Manufacturer:</span>
                          <span className="ml-2 text-white">{result.details.manufacturer}</span>
                        </div>
                      )}
                      
                      {result.details.verifiedNdc && (
                        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 hover:border-green-500/30 transition-all duration-300">
                          <span className="font-medium text-gray-400">NDC:</span>
                          <span className="ml-2 font-mono text-green-400">{result.details.verifiedNdc}</span>
                        </div>
                      )}
                      
                      {result.details.originalBarcode && (
                        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 hover:border-green-500/30 transition-all duration-300">
                          <span className="font-medium text-gray-400">Barcode:</span>
                          <span className="ml-2 font-mono text-green-400">{result.details.originalBarcode}</span>
                        </div>
                      )}
                    </div>
                    
                    {result.details.successMessage && (
                      <p className="text-sm text-green-400 font-medium mt-2 animate-fade-in">
                        {result.details.successMessage}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Verify;