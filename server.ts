import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Helper to extract clean video stream IDs or embed configurations
function parseVideoSource(urlStr: string): { provider: string; id: string | null } {
  try {
    const u = new URL(urlStr);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    
    if (host === 'youtu.be') {
      return { provider: 'youtube', id: u.pathname.slice(1).split('?')[0] };
    }
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
    if (u.hostname.includes('dai.ly')) {
      return { provider: 'dailymotion', id: u.pathname.slice(1) };
    }
    // Direct video files
    if (u.pathname.match(/\.(mp4|webm|ogg|mov|m4v)$/i)) {
      return { provider: 'native_video', id: urlStr };
    }
  } catch (e) {
    // Ignore invalid URL formatting
  }
  return { provider: 'generic', id: null };
}

function absoluteUrl(value: string | undefined, baseUrl: string): string {
  if (!value) return '';
  try {
    return new URL(value, baseUrl).href;
  } catch (e) {
    return value || '';
  }
}

async function startServer() {
  const app = express();

  // Enable CORS
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json({ limit: '10mb' }));

  // Test endpoints
  app.get('/api', (req, res) => {
    res.json({
      success: true,
      message: 'OWNLY Link Studio Engine is running',
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

  // API Endpoint to securely parse any link
  app.post('/api/parse-link', async (req, res) => {
    let { url } = req.body;
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    url = url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      const videoMeta = parseVideoSource(url);

      // Fetch target webpage text for rich metadata extraction
      let title = '';
      let image = '';
      let description = '';
      let siteName = '';

      try {
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
        title = $('meta[property="og:title"]').attr('content') ||
                $('meta[name="twitter:title"]').attr('content') ||
                $('title').text() ||
                url;

        image = $('meta[property="og:image"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content') ||
                '';

        description = $('meta[property="og:description"]').attr('content') ||
                      $('meta[name="twitter:description"]').attr('content') ||
                      $('meta[name="description"]').attr('content') ||
                      '';

        siteName = $('meta[property="og:site_name"]').attr('content') ||
                   new URL(url).hostname.replace(/^www\./, '');
      } catch (scrapeErr) {
        console.warn('Scraping page metadata failed, falling back to direct parser:', (scrapeErr as Error).message);
        try {
          siteName = new URL(url).hostname.replace(/^www\./, '');
        } catch (e) {
          siteName = 'Web Link';
        }
        title = videoMeta.provider !== 'generic' ? `${videoMeta.provider.toUpperCase()} Video` : siteName;
        description = 'Web bookmark';
      }

      // Auto fallback for youtube thumbnail
      if (videoMeta.provider === 'youtube' && (!image || image.length === 0) && videoMeta.id) {
        image = `https://img.youtube.com/vi/${videoMeta.id}/hqdefault.jpg`;
      }
      image = absoluteUrl(image, url);

      // Clean up title
      title = (title || url).trim().replace(/\s+/g, ' ');

      const result = {
        success: true,
        title: title || url,
        description: description ? description.trim() : '',
        embedThumb: image || '',
        linkHost: siteName || new URL(url).hostname.replace(/^www\./, ''),
        embedProvider: videoMeta.provider,
        embedId: videoMeta.id,
        isPlayable: videoMeta.provider !== 'generic',
        url: url
      };

      res.json(result);
    } catch (error) {
      console.error('Error in /api/parse-link:', (error as Error).message);

      const fallbackMeta = parseVideoSource(url);
      let hostName = 'Unknown Site';
      try {
        hostName = new URL(url).hostname;
      } catch (e) {}

      const fallbackResult = {
        success: true,
        title: fallbackMeta.provider !== 'generic' ? `${fallbackMeta.provider.toUpperCase()} Video` : "Bookmarked Link",
        description: "Content loaded successfully",
        embedThumb: fallbackMeta.provider === 'youtube' && fallbackMeta.id ? `https://img.youtube.com/vi/${fallbackMeta.id}/hqdefault.jpg` : "",
        linkHost: hostName.replace(/^www\./, ''),
        embedProvider: fallbackMeta.provider,
        embedId: fallbackMeta.id,
        isPlayable: fallbackMeta.provider !== 'generic',
        url: url
      };

      res.json(fallbackResult);
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OWNLY server running on http://localhost:${PORT}`);
  });
}

startServer();
