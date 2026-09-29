import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { initializeDatabase, query } from "./db.js";
import { verifyToken, generateToken, hashPassword, comparePassword } from "./auth.js";

// ============ WEBSOCKET BROADCAST MAP ============
// userClients: Map<userId, Set<WebSocket>>
const userClients = new Map();

function broadcastToUser(userId, payload, senderWs = null) {
    const clients = userClients.get(String(userId));
    if (!clients) return;
    const msg = JSON.stringify(payload);
    for (const ws of clients) {
        if (ws !== senderWs && ws.readyState === 1) {
            ws.send(msg);
        }
    }
}

function broadcastToAll(payload) {
    const msg = JSON.stringify(payload);
    for (const [, clients] of userClients) {
        for (const ws of clients) {
            if (ws.readyState === 1) ws.send(msg);
        }
    }
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match && !process.env[match[1].trim()])
            process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
}
const PORT = process.env.PORT || 3000;
// Helper to extract clean video stream IDs or embed configurations
function parseVideoSource(urlStr) {
    try {
        const u = new URL(urlStr);
        const host = u.hostname.replace(/^www\./, '').toLowerCase();
        if (host === 'youtu.be') {
            return { provider: 'youtube', id: u.pathname.slice(1).split('?')[0] };
        }
        if (u.hostname.includes('youtube.com')) {
            const v = u.searchParams.get('v');
            if (v)
                return { provider: 'youtube', id: v };
            if (u.pathname.startsWith('/shorts/'))
                return { provider: 'youtube', id: u.pathname.split('/')[2] };
            if (u.pathname.startsWith('/embed/'))
                return { provider: 'youtube', id: u.pathname.split('/')[2] };
        }
        if (u.hostname.includes('vimeo.com')) {
            const m = u.pathname.match(/(\d+)/);
            if (m)
                return { provider: 'vimeo', id: m[1] };
        }
        if (u.hostname.includes('dailymotion.com')) {
            const m = u.pathname.match(/\/video\/([^_/]+)/);
            if (m)
                return { provider: 'dailymotion', id: m[1] };
        }
        if (u.hostname.includes('dai.ly')) {
            return { provider: 'dailymotion', id: u.pathname.slice(1) };
        }
        // Direct video files
        if (u.pathname.match(/\.(mp4|webm|ogg|mov|m4v)$/i)) {
            return { provider: 'native_video', id: urlStr };
        }
    }
    catch (e) {
        // Ignore invalid URL formatting
    }
    return { provider: 'generic', id: null };
}
function absoluteUrl(value, baseUrl) {
    if (!value)
        return '';
    try {
        return new URL(value, baseUrl).href;
    }
    catch (e) {
        return value || '';
    }
}
async function startServer() {
    const app = express();
    // Initialize database
    let dbConnected = false;
    let dbErrorMessage = '';
    try {
        await initializeDatabase();
        dbConnected = true;
        console.log('✅ Database initialized successfully');
    }
    catch (err) {
        dbErrorMessage = err?.message || 'Database connection error';
        console.warn('⚠️ Database connection warning:', dbErrorMessage);
        console.warn('👉 If on Render, please add DATABASE_URL to your Web Service Environment Variables.');
    }
    // Enable CORS
    app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-password', 'x-admin-secret']
    }));
    app.use(express.json({ limit: '10mb' }));
    // ============ ADMIN MIDDLEWARE ============
    const verifyAdmin = (req, res, next) => {
        const adminPassword = req.headers['x-admin-password'];
        if (!process.env.ADMIN_PASSWORD || adminPassword !== process.env.ADMIN_PASSWORD) {
            return res.status(403).json({ success: false, error: 'Unauthorized: Invalid admin password' });
        }
        next();
    };
    // ============ AUTH ENDPOINTS ============
    // Register
    app.post('/api/auth/register', async (req, res) => {
        try {
            const { email, password, name } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, error: 'Email and password required' });
            }
            const passwordHash = await hashPassword(password);
            const result = await query('INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name', [email, passwordHash, name || email.split('@')[0]]);
            const userId = result.rows[0].id;
            const token = generateToken(userId);
            res.json({ success: true, token, user: result.rows[0] });
        }
        catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ success: false, error: 'Email already exists' });
            }
            console.error('Register error:', err);
            res.status(500).json({ success: false, error: 'Registration failed' });
        }
    });
    // Login
    app.post('/api/auth/login', async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, error: 'Email and password required' });
            }
            const result = await query('SELECT id, email, name, password_hash FROM users WHERE email = $1', [email]);
            if (result.rows.length === 0) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }
            const user = result.rows[0];
            const passwordMatch = await comparePassword(password, user.password_hash);
            if (!passwordMatch) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }
            const token = generateToken(user.id);
            res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name } });
        }
        catch (err) {
            console.error('Login error:', err);
            res.status(500).json({ success: false, error: 'Login failed' });
        }
    });
    // ============ NOTES ENDPOINTS ============
    // Get all notes for user
    app.get('/api/notes', verifyToken, async (req, res) => {
        try {
            const result = await query('SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
            res.json({ success: true, notes: result.rows });
        }
        catch (err) {
            console.error('Get notes error:', err);
            res.status(500).json({ success: false, error: 'Failed to fetch notes' });
        }
    });
    // Create note
    app.post('/api/notes', verifyToken, async (req, res) => {
        try {
            const { id, title, content, category, colorTag, isPinned, attachments } = req.body;
            const attachmentsJson = JSON.stringify(attachments || []);
            const result = await query('INSERT INTO notes (id, user_id, title, content, category, color_tag, is_pinned, attachments) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', [id, req.user.id, title, content, category, colorTag, isPinned || false, attachmentsJson]);
            const note = result.rows[0];
            res.json({ success: true, note });
            broadcastToUser(req.user.id, { type: 'note_created', note });
        }
        catch (err) {
            console.error('Create note error:', err);
            res.status(500).json({ success: false, error: 'Failed to create note' });
        }
    });
    // Update note
    app.put('/api/notes/:id', verifyToken, async (req, res) => {
        try {
            const { title, content, category, colorTag, isPinned, attachments } = req.body;
            const attachmentsJson = attachments !== undefined ? JSON.stringify(attachments) : null;
            let queryStr;
            let params;
            if (attachmentsJson !== null) {
                queryStr = 'UPDATE notes SET title = $1, content = $2, category = $3, color_tag = $4, is_pinned = $5, attachments = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND user_id = $8 RETURNING *';
                params = [title, content, category, colorTag, isPinned, attachmentsJson, req.params.id, req.user.id];
            } else {
                queryStr = 'UPDATE notes SET title = $1, content = $2, category = $3, color_tag = $4, is_pinned = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 AND user_id = $7 RETURNING *';
                params = [title, content, category, colorTag, isPinned, req.params.id, req.user.id];
            }
            const result = await query(queryStr, params);
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Note not found' });
            }
            const note = result.rows[0];
            res.json({ success: true, note });
            broadcastToUser(req.user.id, { type: 'note_updated', note });
        }
        catch (err) {
            console.error('Update note error:', err);
            res.status(500).json({ success: false, error: 'Failed to update note' });
        }
    });
    // Delete note
    app.delete('/api/notes/:id', verifyToken, async (req, res) => {
        try {
            const result = await query('DELETE FROM notes WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
            if (result.rowCount === 0) {
                return res.status(404).json({ success: false, error: 'Note not found' });
            }
            res.json({ success: true, message: 'Note deleted' });
            broadcastToUser(req.user.id, { type: 'note_deleted', id: req.params.id });
        }
        catch (err) {
            console.error('Delete note error:', err);
            res.status(500).json({ success: false, error: 'Failed to delete note' });
        }
    });
    // ============ IMAGES ENDPOINTS ============
    // Get all images for user
    app.get('/api/images', verifyToken, async (req, res) => {
        try {
            const result = await query('SELECT * FROM images WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
            res.json({ success: true, images: result.rows });
        }
        catch (err) {
            console.error('Get images error:', err);
            res.status(500).json({ success: false, error: 'Failed to fetch images' });
        }
    });
    // Create image
    app.post('/api/images', verifyToken, async (req, res) => {
        try {
            const { id, name, dataUrl, fileSize, dimensions, source, notes: imgNotes } = req.body;
            const result = await query('INSERT INTO images (id, user_id, name, data_url, file_size, dimensions, source, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', [id, req.user.id, name, dataUrl, fileSize, dimensions, source, imgNotes]);
            const image = result.rows[0];
            res.json({ success: true, image });
            broadcastToUser(req.user.id, { type: 'image_created', image });
        }
        catch (err) {
            console.error('Create image error:', err);
            res.status(500).json({ success: false, error: 'Failed to create image' });
        }
    });
    // Delete image
    app.delete('/api/images/:id', verifyToken, async (req, res) => {
        try {
            const result = await query('DELETE FROM images WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
            if (result.rowCount === 0) {
                return res.status(404).json({ success: false, error: 'Image not found' });
            }
            res.json({ success: true, message: 'Image deleted' });
            broadcastToUser(req.user.id, { type: 'image_deleted', id: req.params.id });
        }
        catch (err) {
            console.error('Delete image error:', err);
            res.status(500).json({ success: false, error: 'Failed to delete image' });
        }
    });
    // ============ LINKS ENDPOINTS ============
    // Get all links for user
    app.get('/api/links', verifyToken, async (req, res) => {
        try {
            const result = await query('SELECT * FROM links WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
            res.json({ success: true, links: result.rows });
        }
        catch (err) {
            console.error('Get links error:', err);
            res.status(500).json({ success: false, error: 'Failed to fetch links' });
        }
    });
    // Create link
    app.post('/api/links', verifyToken, async (req, res) => {
        try {
            const { id, url, title, description, embedThumb, linkHost, embedProvider, embedId, isPlayable } = req.body;
            const result = await query('INSERT INTO links (id, user_id, url, title, description, embed_thumb, link_host, embed_provider, embed_id, is_playable) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *', [id, req.user.id, url, title, description, embedThumb, linkHost, embedProvider, embedId, isPlayable]);
            const link = result.rows[0];
            res.json({ success: true, link });
            broadcastToUser(req.user.id, { type: 'link_created', link });
        }
        catch (err) {
            console.error('Create link error:', err);
            res.status(500).json({ success: false, error: 'Failed to create link' });
        }
    });
    // Delete link
    app.delete('/api/links/:id', verifyToken, async (req, res) => {
        try {
            const result = await query('DELETE FROM links WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
            if (result.rowCount === 0) {
                return res.status(404).json({ success: false, error: 'Link not found' });
            }
            res.json({ success: true, message: 'Link deleted' });
            broadcastToUser(req.user.id, { type: 'link_deleted', id: req.params.id });
        }
        catch (err) {
            console.error('Delete link error:', err);
            res.status(500).json({ success: false, error: 'Failed to delete link' });
        }
    });
    // ============ USER PROFILE ENDPOINTS ============
    // Get user profile
    app.get('/api/user/profile', verifyToken, async (req, res) => {
        try {
            const result = await query('SELECT id, email, name, avatar_url, joined_date, plan, storage_used_mb, total_storage_mb FROM users WHERE id = $1', [req.user.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }
            res.json({ success: true, user: result.rows[0] });
        }
        catch (err) {
            console.error('Get profile error:', err);
            res.status(500).json({ success: false, error: 'Failed to fetch profile' });
        }
    });
    // Update user profile
    app.put('/api/user/profile', verifyToken, async (req, res) => {
        try {
            const { name, avatarUrl } = req.body;
            const result = await query('UPDATE users SET name = $1, avatar_url = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *', [name, avatarUrl, req.user.id]);
            res.json({ success: true, user: result.rows[0] });
        }
        catch (err) {
            console.error('Update profile error:', err);
            res.status(500).json({ success: false, error: 'Failed to update profile' });
        }
    });
    // ============ ADMIN ENDPOINTS ============
    // Get all users (with live connected device count)
    app.get('/api/admin/users', verifyAdmin, async (req, res) => {
        try {
            const result = await query('SELECT id, email, name, joined_date, plan, storage_used_mb FROM users ORDER BY joined_date DESC');
            const users = result.rows.map((u) => ({
                ...u,
                online_devices: userClients.get(String(u.id))?.size || 0,
            }));
            res.json({ success: true, users });
        }
        catch (err) {
            console.error('Admin users error:', err);
            res.status(500).json({ success: false, error: 'Failed to fetch users' });
        }
    });
    // Admin stats: total users, total content counts, live connections
    app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
        try {
            const usersCount = await query('SELECT COUNT(*) FROM users');
            const notesCount = await query('SELECT COUNT(*) FROM notes');
            const imagesCount = await query('SELECT COUNT(*) FROM images');
            const linksCount = await query('SELECT COUNT(*) FROM links');
            let liveConnections = 0;
            for (const [, clients] of userClients) liveConnections += clients.size;
            const liveUsers = userClients.size;
            res.json({
                success: true,
                stats: {
                    totalUsers: parseInt(usersCount.rows[0].count),
                    totalNotes: parseInt(notesCount.rows[0].count),
                    totalImages: parseInt(imagesCount.rows[0].count),
                    totalLinks: parseInt(linksCount.rows[0].count),
                    liveConnections,
                    liveUsers,
                }
            });
        } catch (err) {
            console.error('Admin stats error:', err);
            res.status(500).json({ success: false, error: 'Failed to fetch stats' });
        }
    });
    // Get specific user's data
    app.get('/api/admin/user/:email', verifyAdmin, async (req, res) => {
        try {
            const userResult = await query('SELECT * FROM users WHERE email = $1', [req.params.email]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }
            const userId = userResult.rows[0].id;
            const notes = await query('SELECT * FROM notes WHERE user_id = $1', [userId]);
            const images = await query('SELECT * FROM images WHERE user_id = $1', [userId]);
            const links = await query('SELECT * FROM links WHERE user_id = $1', [userId]);
            res.json({
                success: true,
                user: userResult.rows[0],
                notes: notes.rows,
                images: images.rows,
                links: links.rows
            });
        }
        catch (err) {
            console.error('Admin user data error:', err);
            res.status(500).json({ success: false, error: 'Failed to fetch user data' });
        }
    });
    // Delete user
    app.delete('/api/admin/user/:email', verifyAdmin, async (req, res) => {
        try {
            const userResult = await query('SELECT id FROM users WHERE email = $1', [req.params.email]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }
            const userId = userResult.rows[0].id;
            await query('DELETE FROM notes WHERE user_id = $1', [userId]);
            await query('DELETE FROM images WHERE user_id = $1', [userId]);
            await query('DELETE FROM links WHERE user_id = $1', [userId]);
            await query('DELETE FROM users WHERE id = $1', [userId]);
            res.json({ success: true, message: 'User and all their data deleted' });
        }
        catch (err) {
            console.error('Admin delete error:', err);
            res.status(500).json({ success: false, error: 'Failed to delete user' });
        }
    });
    // Test endpoints
    app.get('/api', (req, res) => {
        res.json({
            success: true,
            message: 'OWNLY Link Studio Engine is running',
            endpoints: {
                auth: '/api/auth/register, /api/auth/login',
                notes: '/api/notes',
                images: '/api/images',
                links: '/api/links',
                profile: '/api/user/profile'
            }
        });
    });
    app.get('/api/test', (req, res) => {
        res.json({
            success: true,
            message: 'Backend is running!',
            database: dbConnected ? 'connected' : 'not_connected',
            databaseNotice: dbConnected ? undefined : 'Please add DATABASE_URL to your Render Web Service Environment Variables',
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
            }
            catch (scrapeErr) {
                console.warn('Scraping page metadata failed, falling back to direct parser:', scrapeErr.message);
                try {
                    siteName = new URL(url).hostname.replace(/^www\./, '');
                }
                catch (e) {
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
        }
        catch (error) {
            console.error('Error in /api/parse-link:', error.message);
            const fallbackMeta = parseVideoSource(url);
            let hostName = 'Unknown Site';
            try {
                hostName = new URL(url).hostname;
            }
            catch (e) { }
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
    }
    else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.use((req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }
    // ============ HTTP + WEBSOCKET SERVER ============
    const httpServer = createServer(app);
    const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

    wss.on('connection', (ws, req) => {
        let userId = null;

        ws.on('message', (raw) => {
            try {
                const msg = JSON.parse(raw);

                // AUTH: client sends { type:'auth', token } on connect
                if (msg.type === 'auth') {
                    try {
                        const secret = process.env.JWT_SECRET || 'ownly-secret-key-change-in-production';
                        const decoded = jwt.verify(msg.token, secret);
                        userId = String(decoded.userId || decoded.id);
                        if (!userClients.has(userId)) userClients.set(userId, new Set());
                        userClients.get(userId).add(ws);
                        ws.send(JSON.stringify({ type: 'auth_ok', userId }));
                        console.log(`🔌 WS: user ${userId} connected (${userClients.get(userId).size} devices)`);
                    } catch {
                        ws.send(JSON.stringify({ type: 'auth_error', error: 'Invalid token' }));
                        ws.close();
                    }
                    return;
                }

                // PING keep-alive
                if (msg.type === 'ping') {
                    ws.send(JSON.stringify({ type: 'pong' }));
                    return;
                }
            } catch { /* ignore malformed messages */ }
        });

        ws.on('close', () => {
            if (userId && userClients.has(userId)) {
                userClients.get(userId).delete(ws);
                if (userClients.get(userId).size === 0) userClients.delete(userId);
                console.log(`❌ WS: user ${userId} disconnected`);
            }
        });
    });

    httpServer.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`✅ OWNLY server running on http://localhost:${PORT}`);
        console.log(`🔌 WebSocket sync active at ws://localhost:${PORT}/ws`);
    });
}
startServer().catch(err => {
    console.error('Server startup failed:', err);
    process.exit(1);
});
