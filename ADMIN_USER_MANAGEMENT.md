# 👨‍💼 OWNLY Admin Panel - User Management Guide

## 🎯 What You Can Do As Admin

As the app owner, you can:
- ✅ View all registered users
- ✅ See what each user has stored (notes, images, links)
- ✅ Delete users and their data
- ✅ Monitor storage usage
- ✅ Generate reports
- ✅ Export user data

---

## 📍 3 Ways to Access User Data

### **Method 1: Render PostgreSQL Console (Easiest)**

**Step 1:** Open Render Dashboard
```
https://dashboard.render.com
→ Click your PostgreSQL database (srv-d96t5q6puehc73f042u0)
→ Click "Shell" or "Browser" tab
```

**Step 2:** Run SQL Commands

**See all users:**
```sql
SELECT id, email, name, joined_date, plan, storage_used_mb FROM users;
```

**See one user's profile:**
```sql
SELECT * FROM users WHERE email = 'customer@example.com';
```

**See all notes from one user:**
```sql
SELECT id, title, category, created_at FROM notes WHERE user_id = 'user-id-here';
```

**See all images from one user:**
```sql
SELECT id, name, file_size, created_at FROM images WHERE user_id = 'user-id-here';
```

**See all links from one user:**
```sql
SELECT id, url, title, created_at FROM links WHERE user_id = 'user-id-here';
```

**Count total data:**
```sql
-- Total users
SELECT COUNT(*) as total_users FROM users;

-- Total notes across all users
SELECT COUNT(*) as total_notes FROM notes;

-- Total images
SELECT COUNT(*) as total_images FROM images;

-- Total links
SELECT COUNT(*) as total_links FROM links;

-- Storage used by all users
SELECT SUM(storage_used_mb) as total_storage_mb FROM users;
```

---

### **Method 2: pgAdmin (Visual Interface)**

**Step 1:** Download & Install
```
Visit: https://www.pgadmin.org/download/
Download pgAdmin 4
Install it
```

**Step 2:** Connect to Your Database
1. Open pgAdmin
2. Right-click "Servers" → "Register" → "Server"
3. Fill in:
   ```
   Name: Topfile (or any name)
   Host: (from Render dashboard)
   Port: 5432
   Username: (your render user)
   Password: (your render password)
   Database: ownly
   ```
4. Click "Save"
5. Browse tables visually!

**Benefits:**
- ✅ Visual interface
- ✅ See data in tables
- ✅ Easy to understand
- ✅ No SQL needed (but you can still write queries)

---

### **Method 3: Add Admin API Endpoint (Best for Your App)**

Add this code to your `server.ts` to create an admin dashboard:

```typescript
// ============ ADMIN ENDPOINTS ============

// Admin Token (use your JWT_SECRET)
const ADMIN_SECRET = process.env.JWT_SECRET;

// Admin middleware
function verifyAdminToken(req: any, res: any, next: any) {
  const token = req.headers['x-admin-token'];
  if (token !== ADMIN_SECRET) {
    return res.status(401).json({ success: false, error: 'Admin token required' });
  }
  next();
}

// 1. Get all users
app.get('/api/admin/users', verifyAdminToken, async (req, res) => {
  try {
    const result = await query('SELECT id, email, name, joined_date, plan, storage_used_mb FROM users ORDER BY joined_date DESC');
    res.json({ success: true, users: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// 2. Get specific user's complete data
app.get('/api/admin/user/:email', verifyAdminToken, async (req, res) => {
  try {
    const userResult = await query('SELECT * FROM users WHERE email = $1', [req.params.email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    const notes = await query('SELECT id, title, category, created_at FROM notes WHERE user_id = $1', [userId]);
    const images = await query('SELECT id, name, file_size, created_at FROM images WHERE user_id = $1', [userId]);
    const links = await query('SELECT id, url, title, created_at FROM links WHERE user_id = $1', [userId]);
    
    res.json({ 
      success: true, 
      user: userResult.rows[0],
      notes: notes.rows,
      images: images.rows,
      links: links.rows,
      summary: {
        total_notes: notes.rows.length,
        total_images: images.rows.length,
        total_links: links.rows.length
      }
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch user data' });
  }
});

// 3. Get statistics
app.get('/api/admin/stats', verifyAdminToken, async (req, res) => {
  try {
    const users = await query('SELECT COUNT(*) as count FROM users');
    const notes = await query('SELECT COUNT(*) as count FROM notes');
    const images = await query('SELECT COUNT(*) as count FROM images');
    const links = await query('SELECT COUNT(*) as count FROM links');
    const storage = await query('SELECT SUM(storage_used_mb) as total FROM users');
    
    res.json({
      success: true,
      stats: {
        total_users: parseInt(users.rows[0].count),
        total_notes: parseInt(notes.rows[0].count),
        total_images: parseInt(images.rows[0].count),
        total_links: parseInt(links.rows[0].count),
        total_storage_mb: parseFloat(storage.rows[0].total || 0)
      }
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// 4. Delete a user and all their data
app.delete('/api/admin/user/:email', verifyAdminToken, async (req, res) => {
  try {
    const userResult = await query('SELECT id FROM users WHERE email = $1', [req.params.email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    // Delete all user data
    await query('DELETE FROM notes WHERE user_id = $1', [userId]);
    await query('DELETE FROM images WHERE user_id = $1', [userId]);
    await query('DELETE FROM links WHERE user_id = $1', [userId]);
    await query('DELETE FROM users WHERE id = $1', [userId]);
    
    res.json({ success: true, message: 'User and all data deleted' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// 5. Update user storage
app.put('/api/admin/user/:email/storage', verifyAdminToken, async (req, res) => {
  try {
    const { storage_mb } = req.body;
    const result = await query('UPDATE users SET storage_used_mb = $1 WHERE email = $2 RETURNING *', 
      [storage_mb, req.params.email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, error: 'Failed to update storage' });
  }
});
```

**How to use these endpoints:**

```bash
# Get all users (replace ADMIN_TOKEN with your JWT_SECRET)
curl -H "x-admin-token: your-jwt-secret" \
  https://topfile.onrender.com/api/admin/users

# Get specific user data
curl -H "x-admin-token: your-jwt-secret" \
  https://topfile.onrender.com/api/admin/user/customer@example.com

# Get statistics
curl -H "x-admin-token: your-jwt-secret" \
  https://topfile.onrender.com/api/admin/stats

# Delete a user
curl -X DELETE -H "x-admin-token: your-jwt-secret" \
  https://topfile.onrender.com/api/admin/user/customer@example.com
```

---

## 📊 Useful SQL Queries

**Find user with most notes:**
```sql
SELECT u.email, COUNT(n.id) as note_count 
FROM users u 
LEFT JOIN notes n ON u.id = n.user_id 
GROUP BY u.id 
ORDER BY note_count DESC 
LIMIT 1;
```

**Find user with most images:**
```sql
SELECT u.email, COUNT(i.id) as image_count 
FROM users u 
LEFT JOIN images i ON u.id = i.user_id 
GROUP BY u.id 
ORDER BY image_count DESC 
LIMIT 1;
```

**Find inactive users (no activity in 30 days):**
```sql
SELECT email, joined_date, 
  MAX(updated_at) as last_activity
FROM users 
GROUP BY id, email, joined_date 
HAVING MAX(updated_at) < NOW() - INTERVAL '30 days'
ORDER BY last_activity DESC;
```

**Export all user emails:**
```sql
SELECT email FROM users ORDER BY email;
```

**User activity report:**
```sql
SELECT 
  u.email,
  COUNT(DISTINCT n.id) as notes,
  COUNT(DISTINCT i.id) as images,
  COUNT(DISTINCT l.id) as links,
  u.storage_used_mb,
  u.joined_date
FROM users u
LEFT JOIN notes n ON u.id = n.user_id
LEFT JOIN images i ON u.id = i.user_id
LEFT JOIN links l ON u.id = l.user_id
GROUP BY u.id, u.email, u.storage_used_mb, u.joined_date
ORDER BY u.joined_date DESC;
```

---

## 🔐 Security Best Practices

⚠️ **IMPORTANT:**
- Never share your database password
- Never push `.env` to GitHub
- Change JWT_SECRET regularly
- Only access database from secure location
- Backup data regularly (Render does this automatically)

---

## 📈 Monthly Admin Checklist

- [ ] Check total user count
- [ ] Review storage usage
- [ ] Look for inactive users
- [ ] Check database backups (Render dashboard)
- [ ] Update security credentials
- [ ] Test data exports
- [ ] Review access logs

---

## 🆘 Common Admin Tasks

### "User is complaining about lost data"
1. Check if user exists: `SELECT * FROM users WHERE email = 'user@example.com';`
2. If user exists, check their data: See Method 1 above
3. If data is gone, restore from backup: Render Dashboard → PostgreSQL → Backups

### "Need to reset user password"
Since passwords are hashed, user must use "Forgot Password" feature or:
```sql
-- Delete user so they can register again
DELETE FROM users WHERE email = 'user@example.com';
```

### "User has too much data"
```sql
-- Check user's storage
SELECT email, storage_used_mb FROM users WHERE email = 'user@example.com';

-- Clear old notes (example: older than 1 year)
DELETE FROM notes WHERE user_id = 'user-id' AND created_at < NOW() - INTERVAL '1 year';
```

### "Need to export all data"
```sql
-- Export notes
\copy (SELECT * FROM notes) TO '/tmp/notes.csv' CSV HEADER;

-- Export users
\copy (SELECT * FROM users) TO '/tmp/users.csv' CSV HEADER;
```

---

## 📞 Support

**Your Database Details:**
- Service ID: srv-d96t5q6puehc73f042u0
- Platform: Render PostgreSQL
- App URL: https://topfile.onrender.com
- Admin access: Use JWT_SECRET from .env

**Need help?**
- Check Render Dashboard logs
- Review database backups
- Test queries locally with psql

---

**You now have complete control over all user data!** 🎉
