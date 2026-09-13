# 🎓 OWNLY Complete Architecture Guide - Everything Explained

## 📋 What is OWNLY?

**OWNLY** is a personal workspace application where users can:
- 📝 **Create Notes** - Save thoughts, ideas, tasks
- 📸 **Upload Images** - Store photos/screenshots
- 🔗 **Save Links** - Bookmark YouTube videos, websites, articles
- 💬 **Use AI Assistant** - Get help organizing their workspace

---

## 🏗️ How It Works (Complete Architecture)

### **BEFORE (You Used Firebase)**
```
User App → Firebase Cloud → Google Servers
           (You had no control)
```

### **NOW (You Control Everything)**
```
User App → Your API Server (Render) → Your PostgreSQL Database (Render)
           (You own it completely!)
```

---

## 🔄 The Complete Flow

### **When User Signs Up:**
```
1. User enters email & password
2. Browser sends → Your API Server at https://topfile.onrender.com
3. Server hashes password (secure) & saves to PostgreSQL
4. Server sends back JWT token
5. Token stored in browser (localStorage)
6. User logged in! ✅
```

### **When User Creates a Note:**
```
1. User types note in app
2. Browser sends to API with token
3. API checks token (is this real user?)
4. If valid → saves note to PostgreSQL
5. Note appears in app ✅
```

### **Database Structure:**

```sql
┌─────────────────────────────────────────┐
│           PostgreSQL Database           │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   USERS TABLE                    │  │
│  ├──────────────────────────────────┤  │
│  │ id         | UUID                │  │
│  │ email      | user@example.com    │  │
│  │ name       | John Doe            │  │
│  │ password   | (encrypted)         │  │
│  │ avatar_url | image url           │  │
│  │ joined_date| 2026-09-13          │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   NOTES TABLE                    │  │
│  ├──────────────────────────────────┤  │
│  │ id        | note-1               │  │
│  │ user_id   | (links to USERS)     │  │
│  │ title     | "My First Note"      │  │
│  │ content   | "Note content..."    │  │
│  │ category  | "Work"               │  │
│  │ created   | 2026-09-13           │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   IMAGES TABLE                   │  │
│  ├──────────────────────────────────┤  │
│  │ id        | image-1              │  │
│  │ user_id   | (links to USERS)     │  │
│  │ name      | "screenshot.png"     │  │
│  │ data_url  | (base64 image data)  │  │
│  │ created   | 2026-09-13           │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   LINKS TABLE                    │  │
│  ├──────────────────────────────────┤  │
│  │ id           | link-1            │  │
│  │ user_id      | (links to USERS)  │  │
│  │ url          | youtube.com/...   │  │
│  │ title        | "Video Title"     │  │
│  │ embed_thumb  | thumbnail image   │  │
│  │ created      | 2026-09-13        │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🖥️ Your Server Components

### **1. Express Server** (server.ts)
```
Role: Handles all requests from the app
Listens on: https://topfile.onrender.com

What it does:
├── Checks if user is logged in
├── Validates data
├── Saves/retrieves from database
├── Returns responses
└── Handles security
```

### **2. Database** (PostgreSQL)
```
Role: Stores all user data permanently
Location: Render PostgreSQL service

What it stores:
├── User accounts & passwords
├── Notes
├── Images
└── Links
```

### **3. Authentication** (auth.ts)
```
Role: Keeps users secure
Method: JWT (JSON Web Token)

How it works:
1. User logs in → gets token
2. Token stored in browser
3. Every request includes token
4. Server checks token
5. If valid → process request
6. If invalid → reject request
```

---

## 📊 How to See & Manage User Data

### **Option 1: Direct Database Access (SQL Commands)**

If you have PostgreSQL installed locally:

```bash
# Connect to your Render database
psql "postgresql://user:password@hostname:5432/database"

# View all users
SELECT id, email, name, joined_date FROM users;

# View specific user's notes
SELECT * FROM notes WHERE user_id = 'user-id-here';

# View all images from a user
SELECT id, name, created_at FROM images WHERE user_id = 'user-id-here';

# Count total notes across all users
SELECT COUNT(*) FROM notes;

# Delete user and all their data
DELETE FROM users WHERE email = 'user@example.com';
```

### **Option 2: Using Admin Dashboard (Render Console)**

**Step 1:** Go to https://dashboard.render.com
1. Log in with your account
2. Find your PostgreSQL database (srv-d96t5q6puehc73f042u0)
3. Click on it

**Step 2:** Use "PostgreSQL Shell"
1. Click **"Shell"** tab
2. Run SQL commands above
3. See results

**Step 3:** For visual viewing, use pgAdmin:
1. Download pgAdmin from pgadmin.org
2. Connect to your Render PostgreSQL
3. Browse tables visually

### **Option 3: Create Admin API Endpoint** (Best)

I can add an admin endpoint to see all users. Add this to `server.ts`:

```typescript
// Admin endpoint - View all users (ADD TO server.ts)
app.get('/api/admin/users', verifyAdminToken, async (req, res) => {
  const result = await query('SELECT id, email, name, joined_date, storage_used_mb FROM users');
  res.json({ success: true, users: result.rows });
});

// Admin endpoint - View user's data
app.get('/api/admin/user/:email/data', verifyAdminToken, async (req, res) => {
  const result = await query('SELECT * FROM users WHERE email = $1', [req.params.email]);
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  const userId = result.rows[0].id;
  const notes = await query('SELECT * FROM notes WHERE user_id = $1', [userId]);
  const images = await query('SELECT * FROM images WHERE user_id = $1', [userId]);
  const links = await query('SELECT * FROM links WHERE user_id = $1', [userId]);
  
  res.json({ 
    success: true, 
    user: result.rows[0], 
    notes: notes.rows,
    images: images.rows,
    links: links.rows
  });
});

// Admin endpoint - Delete user
app.delete('/api/admin/user/:email', verifyAdminToken, async (req, res) => {
  await query('DELETE FROM users WHERE email = $1', [req.params.email]);
  res.json({ success: true, message: 'User deleted' });
});
```

---

## 🔐 Your Database Credentials

```
Provider: Render PostgreSQL
Service ID: srv-d96t5q6puehc73f042u0
Database URL: (in your Render dashboard)
Host: hostname.render.com
Port: 5432
Database: ownly
User: (your render user)
Password: (your render password)
```

**Where to find them:**
1. Go to https://dashboard.render.com
2. Click "PostgreSQL" → Your database
3. Scroll to "Connections"
4. Copy "External Database URL"

---

## 📝 File Structure Explained

```
your-project/
├── server.ts              👈 Main server (handles all requests)
├── db.ts                  👈 Database connection & schema
├── auth.ts                👈 Authentication (JWT tokens)
├── src/
│   ├── lib/
│   │   ├── api.ts        👈 Frontend talks to backend
│   │   └── firebase.ts   👈 (Old - will remove)
│   ├── components/       👈 React pages (UI)
│   └── types.ts          👈 Data types
├── package.json          👈 Dependencies
├── .env                  👈 Secrets (DATABASE_URL, JWT_SECRET)
└── dist/                 👈 Compiled app (what Render runs)
```

---

## 🚀 Your Render Deployment

```
┌─────────────────────────────────────┐
│   https://topfile.onrender.com      │
│                                     │
│   ┌─────────────────────────────┐  │
│   │   Web Service               │  │
│   │   ├── Node.js Runtime       │  │
│   │   ├── Express Server        │  │
│   │   ├── API Endpoints         │  │
│   │   └── Serves Frontend       │  │
│   └─────────────────────────────┘  │
│                                     │
│   Talks to:                         │
│   ↓                                 │
│   ┌─────────────────────────────┐  │
│   │   PostgreSQL Database       │  │
│   │   srv-d96t5q6puehc73f042u0  │  │
│   │   ├── Users                 │  │
│   │   ├── Notes                 │  │
│   │   ├── Images                │  │
│   │   └── Links                 │  │
│   └─────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔌 API Endpoints (What Your App Uses)

### **Authentication**
```
POST /api/auth/register
├── Input: email, password, name
└── Output: JWT token

POST /api/auth/login
├── Input: email, password
└── Output: JWT token
```

### **Notes**
```
GET /api/notes
└── Returns: All user's notes

POST /api/notes
├── Input: title, content, category, colorTag
└── Output: Saved note

PUT /api/notes/:id
├── Input: Updated note data
└── Output: Updated note

DELETE /api/notes/:id
└── Deletes note
```

### **Images**
```
GET /api/images
└── Returns: All user's images

POST /api/images
├── Input: name, dataUrl, fileSize, dimensions
└── Output: Saved image

DELETE /api/images/:id
└── Deletes image
```

### **Links**
```
GET /api/links
└── Returns: All user's links

POST /api/links
├── Input: url, title, description, embedThumb
└── Output: Saved link

DELETE /api/links/:id
└── Deletes link
```

### **User Profile**
```
GET /api/user/profile
└── Returns: User info

PUT /api/user/profile
├── Input: name, avatarUrl
└── Output: Updated profile
```

---

## 🛡️ Security Overview

### **How User Data is Protected:**

1. **Passwords are Hashed**
   - Stored as: `$2b$10$xxxx...` (bcrypt)
   - Cannot be reversed
   - Even you can't see passwords

2. **JWT Tokens**
   - User gets token after login
   - Token stored in browser
   - Expires in 7 days
   - Each request must include token

3. **Database Access**
   - Only through API
   - API checks authentication
   - Users can only see their own data

4. **Environment Variables**
   - Secrets stored in `.env`
   - Never pushed to GitHub
   - Only on Render server

---

## 📊 Common Admin Tasks

### **View All Users**
```bash
# SSH into your server and run:
psql "DATABASE_URL" -c "SELECT email, name, joined_date FROM users;"
```

### **See User's Storage Usage**
```bash
psql "DATABASE_URL" -c "SELECT email, storage_used_mb FROM users;"
```

### **Delete a User & All Their Data**
```bash
psql "DATABASE_URL" -c "DELETE FROM users WHERE email = 'user@example.com';"
```

### **Backup Your Database**
```
Render does this automatically!
Go to Render Dashboard → PostgreSQL → Backups
```

---

## 🎯 Key Differences: Firebase vs PostgreSQL

| Feature | Firebase | PostgreSQL |
|---------|----------|-----------|
| **Who Owns** | Google | You |
| **Backup** | Google manages | Render manages |
| **Cost** | Pay Google | Render free tier |
| **Customer Trust** | Data on Google | Data on your server |
| **Compliance** | Subject to Google ToS | You control |
| **Performance** | Good | Excellent |
| **Scalability** | Limited free | Unlimited |

---

## 💡 What's Next?

1. ✅ Code is deployed to Render
2. ✅ Database is created
3. ✅ All endpoints working
4. 📝 **You need to:** Push this to GitHub
5. 📝 **You need to:** Tell customers about migration

---

## 🆘 Troubleshooting

### "Cannot connect to database"
→ Check DATABASE_URL in Render environment variables

### "Invalid token"
→ User needs to login again (token expired)

### "API returning 404"
→ Check if endpoint name is correct (typo?)

### "Out of storage"
→ Delete old images or upgrade plan

---

## ✉️ Ready to Push to GitHub?

Your GitHub repo: `https://github.com/Master-mind-dev/Topfile`
Account: Master-mind-dev
Email: rmohammeddastagir1@gmail.com

I'll update your repository with all new files in the next step! 🚀
