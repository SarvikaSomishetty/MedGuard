import axios from 'axios';

const OPENFDA_API_KEY = process.env.OPENFDA_API_KEY;
const OPENFDA_BASE_URL = 'https://api.fda.gov/drug/ndc.json';

export interface VerificationResult {
  status: 'real' | 'fake' | 'suspicious';
  details: {
    name?: string;
    manufacturer?: string;
    activeIngredients?: string[];
    dosage?: string;
    ndcCode?: string;
    confidence?: number;
    warnings?: string[];
  };
}

export async function verifyByBarcode(code: string): Promise<VerificationResult> {
  try {
    if (!OPENFDA_API_KEY) {
      console.error('OpenFDA API key is not configured');
      return {
        status: 'suspicious',
        details: {
          ndcCode: code,
          confidence: 0,
          warnings: ['OpenFDA API key is not configured']
        }
      };
    }

    console.log(`Verifying medicine with code: ${code}`);
    console.log(`Using OpenFDA API URL: ${OPENFDA_BASE_URL}`);

    // First, try exact NDC code match
    const exactResponse = await axios.get(OPENFDA_BASE_URL, {
      params: {
        api_key: OPENFDA_API_KEY,
        search: `product_ndc:"${code}"`,
        limit: 1
      }
    });

    console.log('OpenFDA API Response:', JSON.stringify(exactResponse.data, null, 2));

    if (exactResponse.data.results && exactResponse.data.results.length > 0) {
      const medicine = exactResponse.data.results[0];
      return {
        status: 'real',
        details: {
          name: medicine.brand_name || medicine.generic_name,
          manufacturer: medicine.manufacturer_name,
          activeIngredients: medicine.active_ingredients?.map((i: any) => i.name) || [],
          dosage: medicine.dosage_form,
          ndcCode: medicine.product_ndc,
          confidence: 0.95
        }
      };
    }

    // If exact match not found, try partial match
    console.log('No exact match found, trying partial search');
    const partialResponse = await axios.get(OPENFDA_BASE_URL, {
      params: {
        api_key: OPENFDA_API_KEY,
        search: `product_ndc:${code}`,
        limit: 1
      }
    });

    console.log('Partial Search Response:', JSON.stringify(partialResponse.data, null, 2));

    if (partialResponse.data.results && partialResponse.data.results.length > 0) {
      const medicine = partialResponse.data.results[0];
      return {
        status: 'suspicious',
        details: {
          name: medicine.brand_name || medicine.generic_name,
          manufacturer: medicine.manufacturer_name,
          activeIngredients: medicine.active_ingredients?.map((i: any) => i.name) || [],
          dosage: medicine.dosage_form,
          ndcCode: medicine.product_ndc,
          confidence: 0.7,
          warnings: ['Barcode partially matches FDA database']
        }
      };
    }

    // If no matches found
    console.log('No matches found in FDA database');
    return {
      status: 'suspicious',
      details: {
        ndcCode: code,
        confidence: 0.3,
        warnings: [
          'Medicine not found in FDA database',
          'Please verify the barcode and try again',
          'If problems persist, consult a healthcare professional'
        ]
      }
    };
  } catch (error) {
    console.error('Error verifying medicine:', error);
    if (axios.isAxiosError(error)) {
      console.error('API Error details:', {
        status: error.response?.status,
        data: error.response?.data
      });

      if (error.response?.status === 401) {
        return {
          status: 'suspicious',
          details: {
            ndcCode: code,
            confidence: 0,
            warnings: ['Invalid OpenFDA API key']
          }
        };
      }
    }

    return {
      status: 'suspicious',
      details: {
        ndcCode: code,
        confidence: 0,
        warnings: ['Error during verification: ' + (error as Error).message]
      }
    };
  }
} 