import axios from 'axios';
import { VerificationResult } from './verification';

const OPENFDA_API_KEY = process.env.OPENFDA_API_KEY;
const OPENFDA_BASE_URL = 'https://api.fda.gov/drug/ndc.json';

export async function searchMedicine(name: string): Promise<VerificationResult> {
  try {
    if (!OPENFDA_API_KEY) {
      console.error('OpenFDA API key is not configured');
      return {
        status: 'suspicious',
        details: {
          name,
          warnings: ['OpenFDA API key is not configured']
        }
      };
    }

    console.log(`Searching for medicine: ${name}`);
    console.log(`Using OpenFDA API URL: ${OPENFDA_BASE_URL}`);

    // Search OpenFDA database
    const fdaResponse = await axios.get(OPENFDA_BASE_URL, {
      params: {
        api_key: OPENFDA_API_KEY,
        search: `generic_name:"${name}" OR brand_name:"${name}"`,
        limit: 1
      }
    });

    console.log('OpenFDA API Response:', JSON.stringify(fdaResponse.data, null, 2));

    if (fdaResponse.data.results && fdaResponse.data.results.length > 0) {
      const medicine = fdaResponse.data.results[0];
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

    // If not found, try fuzzy search
    console.log('No exact match found, trying fuzzy search');
    const fuzzyResponse = await axios.get(OPENFDA_BASE_URL, {
      params: {
        api_key: OPENFDA_API_KEY,
        search: `generic_name:"${name}"~2 OR brand_name:"${name}"~2`,
        limit: 1
      }
    });

    console.log('Fuzzy Search Response:', JSON.stringify(fuzzyResponse.data, null, 2));

    if (fuzzyResponse.data.results && fuzzyResponse.data.results.length > 0) {
      const medicine = fuzzyResponse.data.results[0];
      return {
        status: 'suspicious',
        details: {
          name: medicine.brand_name || medicine.generic_name,
          manufacturer: medicine.manufacturer_name,
          activeIngredients: medicine.active_ingredients?.map((i: any) => i.name) || [],
          dosage: medicine.dosage_form,
          ndcCode: medicine.product_ndc,
          confidence: 0.7,
          warnings: ['Found similar medicine name, please verify details']
        }
      };
    }

    console.log('No results found in OpenFDA database');
    return {
      status: 'suspicious',
      details: {
        name,
        confidence: 0,
        warnings: ['Medicine not found in FDA database']
      }
    };
  } catch (error) {
    console.error('Error searching medicine:', error);
    if (axios.isAxiosError(error)) {
      console.error('API Error details:', {
        status: error.response?.status,
        data: error.response?.data
      });
    }
    return {
      status: 'suspicious',
      details: {
        name,
        warnings: ['Error during search process: ' + (error as Error).message]
      }
    };
  }
} 