import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { verifyByBarcode } from './services/verification';
import { searchMedicine } from './services/search';
import { analyzeImage } from './services/imageAnalysis';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Barcode verification endpoint
app.get('/api/verify', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Barcode code is required' });
    }

    const result = await verifyByBarcode(code);
    res.json(result);
  } catch (error) {
    console.error('Error verifying medicine:', error);
    res.status(500).json({ error: 'Failed to verify medicine' });
  }
});

// Medicine search endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Medicine name is required' });
    }

    const result = await searchMedicine(name);
    res.json(result);
  } catch (error) {
    console.error('Error searching medicine:', error);
    res.status(500).json({ error: 'Failed to search medicine' });
  }
});

// Image analysis endpoint
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const result = await analyzeImage(image);
    res.json(result);
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 