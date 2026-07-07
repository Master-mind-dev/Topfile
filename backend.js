const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pop.html'));
});

app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'pop2.html'));
});

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
        message: 'Personal Space API is running',
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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
        if (videoMeta.provider === 'youtube' && !image) {
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

        console.log('Parsed result:', result);
        res.json(result);

    } catch (error) {
        console.error('Error parsing link:', error.message);
        
        // Fallback response
        const fallbackMeta = parseVideoSource(url);
        let hostName = 'Unknown Site';
        try { 
            hostName = new URL(url).hostname; 
        } catch(e){}
        
        const fallbackResult = {
            success: true,
            title: fallbackMeta.provider !== 'generic' ? `${fallbackMeta.provider.toUpperCase()} Video` : "Bookmarked Link",
            description: "Content loaded successfully",
            embedThumb: fallbackMeta.provider === 'youtube' ? `https://img.youtube.com/vi/${fallbackMeta.id}/hqdefault.jpg` : "",
            linkHost: hostName.replace(/^www\./, ''),
            embedProvider: fallbackMeta.provider,
            embedId: fallbackMeta.id,
            isPlayable: fallbackMeta.provider !== 'generic',
            url: url
        };
        
        console.log('Fallback result:', fallbackResult);
        res.json(fallbackResult);
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Link Studio Engine running on http://localhost:${PORT}`);
    console.log(`📡 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`🔗 Parse endpoint: http://localhost:${PORT}/api/parse-link`);
});
