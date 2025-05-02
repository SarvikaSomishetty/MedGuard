import { createWorker } from 'tesseract.js';

interface ImageAnalysisResult {
  status: 'real' | 'fake' | 'suspicious';
  details: {
    text?: string;
    confidence?: number;
    warnings?: string[];
    visualFeatures?: {
      packagingQuality: number;
      logoMatch: number;
      textClarity: number;
    };
  };
}

export async function analyzeImage(imageBuffer: Buffer): Promise<ImageAnalysisResult> {
  try {
    // Extract text using OCR
    const { text, confidence } = await extractText(imageBuffer);

    // For testing without ML models, use OCR confidence as the main indicator
    const visualFeatures = {
      packagingQuality: confidence,
      logoMatch: confidence,
      textClarity: confidence
    };

    // Determine overall status based on OCR confidence
    const status = determineStatus(visualFeatures);

    return {
      status,
      details: {
        text,
        confidence,
        visualFeatures,
        warnings: generateWarnings(visualFeatures)
      }
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      status: 'suspicious',
      details: {
        warnings: ['Error during image analysis']
      }
    };
  }
}

async function extractText(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
  const worker = await createWorker();
  const { data: { text, confidence } } = await worker.recognize(imageBuffer);
  await worker.terminate();
  return { text, confidence };
}

function determineStatus(features: {
  packagingQuality: number;
  logoMatch: number;
  textClarity: number;
}): 'real' | 'fake' | 'suspicious' {
  const avgConfidence = (features.packagingQuality + features.logoMatch + features.textClarity) / 3;
  
  if (avgConfidence > 0.8) {
    return 'real';
  } else if (avgConfidence < 0.4) {
    return 'fake';
  } else {
    return 'suspicious';
  }
}

function generateWarnings(features: {
  packagingQuality: number;
  logoMatch: number;
  textClarity: number;
}): string[] {
  const warnings: string[] = [];

  if (features.packagingQuality < 0.6) {
    warnings.push('Low text clarity detected');
  }
  if (features.logoMatch < 0.6) {
    warnings.push('Text verification confidence is low');
  }
  if (features.textClarity < 0.6) {
    warnings.push('Text clarity is low');
  }

  return warnings;
} 