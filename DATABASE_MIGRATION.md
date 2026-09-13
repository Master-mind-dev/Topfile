# OWNLY Database Migration: Firebase → PostgreSQL

## 📋 What Changed

### ✅ Complete Migration Completed
Your data storage has been moved from Firebase to your own **PostgreSQL database on Render**.

### 🔄 Files Created/Updated

1. **db.ts** - PostgreSQL connection & schema setup
2. **auth.ts** - JWT authentication
3. **server.ts** - Updated with database API endpoints
4. **src/lib/api.ts** - Frontend API client
5. **.env.example** - Environment variables template
6. **RENDER_DEPLOYMENT.md** - Deployment instructions
7. **package.json** - Added pg, bcrypt, jsonwebtoken

### 📦 New Dependencies Added
```json
{
  "pg": "^8.11.3",
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.1.2"
}
```

## 🚀 Next Steps

### 1. Install Dependencies Locally
```bash
npm install
```

### 2. Create .env File
Copy `.env.example` to `.env` and fill in:
```bash
cp .env.example .env
```

### 3. Test Locally with PostgreSQL
Install PostgreSQL locally or use:
```bash
docker run --name ownly-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=ownly -p 5432:5432 -d postgres:15
```

Then set in `.env`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/ownly
JWT_SECRET=test-secret-key
```

### 4. Start Local Server
```bash
npm run dev
```

### 5. Deploy to Render
Follow: [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)

## 🔐 Data Ownership

**Before (Firebase):**
- Data stored on Google's servers
- Google manages encryption
- Subject to Firebase terms

**After (PostgreSQL on Render):**
- Data stored on **your own** Render PostgreSQL server
- You control backups & recovery
- Full GDPR compliance
- Complete data ownership

## 📊 API Endpoints

### Authentication
```
POST /api/auth/register    - Register new user
POST /api/auth/login       - Login user
```

### Notes
```
GET    /api/notes          - Get all notes
POST   /api/notes          - Create note
PUT    /api/notes/:id      - Update note
DELETE /api/notes/:id      - Delete note
```

### Images
```
GET    /api/images         - Get all images
POST   /api/images         - Upload image
DELETE /api/images/:id     - Delete image
```

### Links
```
GET    /api/links          - Get all links
POST   /api/links          - Save link
DELETE /api/links/:id      - Delete link
```

### User Profile
```
GET    /api/user/profile   - Get profile
PUT    /api/user/profile   - Update profile
```

## 🔄 Frontend Migration

The frontend still uses React but now calls your API instead of Firebase:

**Old (Firebase):**
```typescript
import { auth, db, setDoc } from './lib/firebase';
```

**New (Your API):**
```typescript
import { createNote, updateNote, deleteNote } from './lib/api';
```

All API calls are in: [src/lib/api.ts](src/lib/api.ts)

## 💾 Data Migration

### Current Data Status
Your existing local data (localStorage) will continue to work.

### Export from Firebase (Optional)
If you want to export existing Firebase data:
1. Go to Firebase Console
2. Click Export data button
3. Download JSON
4. Import to PostgreSQL

## 🆘 Troubleshooting

### "Cannot connect to database"
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

### "Invalid token"
- Clear localStorage: `localStorage.clear()`
- Login again
- Token lasts 7 days

### "Port 3000 already in use"
```bash
lsof -i :3000        # Find process
kill -9 <PID>        # Kill it
```

## 📚 Documentation

- [Express API Docs](https://expressjs.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [JWT Guide](https://jwt.io/)
- [Render Docs](https://render.com/docs)

## ✨ Benefits

✅ Complete data ownership  
✅ GDPR compliant  
✅ No vendor lock-in  
✅ Full control over backups  
✅ Transparent data handling  
✅ Customer confidence restored  
✅ Scalable architecture  

---

**Questions?** Check the API endpoints and test with curl or Postman!
