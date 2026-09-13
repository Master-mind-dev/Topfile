import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
// Middleware to verify JWT token
export function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { id: decoded.userId };
        next();
    }
    catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
}
// Generate JWT token
export function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}
// Hash password
export async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}
// Compare password
export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}
