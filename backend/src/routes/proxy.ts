import express from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

const router = express.Router();

router.get('/proxy-image', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: 'URL parameter is required' });
    }

    // Check if the URL is for a logo on our own server
    if (url.includes('/logos/')) {
      const teamName = url.split('/logos/')[1];
      const pngPath = path.join(__dirname, `../../public/logos/${teamName}.png`);
      const svgPath = path.join(__dirname, `../../public/logos/${teamName}.svg`);
      
      // Check if the PNG file exists
      if (fs.existsSync(pngPath)) {
        res.sendFile(pngPath);
        return;
      } 
      // Check if the SVG file exists
      else if (fs.existsSync(svgPath)) {
        res.sendFile(svgPath);
        return;
      }
    }

    // If not a logo or logo not found, proceed with external URL
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Set appropriate headers
    res.set('Content-Type', response.headers['content-type']);
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Send the image data
    res.send(response.data);
  } catch (error) {
    logger.error('Error proxying image:', error);
    res.status(500).json({ message: 'Error fetching image' });
  }
});

export default router; 