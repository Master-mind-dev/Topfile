import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
  }
}

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Helper to extract clean video stream IDs or embed configurations
function parseVideoSource(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') return { provider: 'youtube', id: u.pathname.slice(1) };
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return { provider: 'youtube', id: v };
      if (u.pathname.startsWith('/shorts/')) return { provider: 'youtube', id: u.pathname.split('/')[2] };
      if (u.pathname.startsWith('/embed/')) return { provider: 'youtube', id: u.pathname.split('/')[2] };
    }
    if (u.hostname.includes('vimeo.com')) {
      const m = u.pathname.match(/(\d+)/);
      if (m) return { provider: 'vimeo', id: m[1] };
    }
    if (u.hostname.includes('dailymotion.com')) {
      const m = u.pathname.match(/\/video\/([^_/]+)/);
      if (m) return { provider: 'dailymotion', id: m[1] };
    }
    if (u.hostname.includes('dai.ly')) return { provider: 'dailymotion', id: u.pathname.slice(1) };
    // Direct video files
    if (u.pathname.match(/\.(mp4|webm|ogg|mov|m4v)$/i)) {
      return { provider: 'native_video', id: url };
    }
  } catch (e) {}
  return { provider: 'generic', id: null };
}

function absoluteUrl(value, baseUrl) {
  if (!value) return '';
  try {
    return new URL(value, baseUrl).href;
  } catch (e) {
    return '';
  }
}

// Test route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'OWNLY Workspace Personal Space API is running',
    endpoints: {
      test: '/api/test',
      parseLink: '/api/parse-link'
    }
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend is running!',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/assistant', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt, context } = req.body || {};
  if (!apiKey) {
    return res.status(503).json({ success: false, error: 'Gemini is not configured on the server.' });
  }
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ success: false, error: 'A prompt is required.' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'You are OWNLY AI, a concise workspace assistant. Help users understand and organize their notes, images, and links. You may recommend actions, but never claim to have changed files or data unless the application explicitly reports that action.' }] },
        contents: [{ parts: [{ text: `Workspace context:\n${JSON.stringify(context || {})}\n\nUser request:\n${prompt}` }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 700 },
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: data.error?.message || 'Gemini request failed.' });
    }
    const answer = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || 'No answer was returned.';
    return res.json({ success: true, answer });
  } catch (error) {
    console.error('Gemini assistant error:', error.message);
    return res.status(502).json({ success: false, error: 'The Gemini assistant could not be reached.' });
  }
});

// API Endpoint to securely parse any link
app.post('/api/parse-link', async (req, res) => {
  console.log('Received request to parse:', req.body.url);
  
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ 
      success: false, 
      error: 'URL is required' 
    });
  }

  try {
    const videoMeta = parseVideoSource(url);
    
    // Fetch target webpage text for rich metadata extraction
    const response = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 8000,
      maxRedirects: 5
    });
    
    const $ = cheerio.load(response.data);
    
    // Scrape OpenGraph Metadata tags
    let title = $('meta[property="og:title"]').attr('content') || 
                $('meta[name="twitter:title"]').attr('content') || 
                $('title').text() || 
                url;
    
    let image = $('meta[property="og:image"]').attr('content') || 
                $('meta[name="twitter:image"]').attr('content') || 
                '';
    
    const description = $('meta[property="og:description"]').attr('content') || 
                        $('meta[name="twitter:description"]').attr('content') || 
                        $('meta[name="description"]').attr('content') || 
                        '';
    
    const siteName = $('meta[property="og:site_name"]').attr('content') || 
                     new URL(url).hostname.replace(/^www\./, '');

    // Auto fallback for youtube thumbnail
    if (videoMeta.provider === 'youtube' && !image && videoMeta.id) {
      image = `https://img.youtube.com/vi/${videoMeta.id}/hqdefault.jpg`;
    }
    image = absoluteUrl(image, url);

    // Clean up title
    title = title.trim().replace(/\s+/g, ' ');

    const result = {
      success: true,
      title: title || url,
      description: description.trim(),
      embedThumb: image || '',
      linkHost: siteName,
      embedProvider: videoMeta.provider,
      embedId: videoMeta.id,
      isPlayable: videoMeta.provider !== 'generic',
      url: url
    };

    console.log('Parsed result:', result.title);
    res.json(result);

  } catch (error) {
    console.error('Error parsing link:', error.message);
    
    // Fallback response
    const fallbackMeta = parseVideoSource(url);
    let hostName = 'web';
    try { 
      hostName = new URL(url).hostname; 
    } catch(e){}
    
    const fallbackResult = {
      success: true,
      title: fallbackMeta.provider !== 'generic' && fallbackMeta.id ? `${fallbackMeta.provider.toUpperCase()} Video` : (hostName || "Bookmarked Link"),
      description: "Content loaded successfully into workspace",
      embedThumb: fallbackMeta.provider === 'youtube' && fallbackMeta.id ? `https://img.youtube.com/vi/${fallbackMeta.id}/hqdefault.jpg` : "",
      linkHost: hostName.replace(/^www\./, ''),
      embedProvider: fallbackMeta.provider,
      embedId: fallbackMeta.id,
      isPlayable: fallbackMeta.provider !== 'generic',
      url: url
    };
    
    console.log('Fallback result:', fallbackResult.title);
    res.json(fallbackResult);
  }
});

// Fallback to static app if dist exists
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 OWNLY Link Studio Engine running on http://localhost:${PORT}`);
  console.log(`📡 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔗 Parse endpoint: http://localhost:${PORT}/api/parse-link`);
});
