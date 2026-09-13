# 🚀 Deploy OWNLY to Render with PostgreSQL

## Step 1: Create a Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub or email
3. Connect your GitHub repository

## Step 2: Create PostgreSQL Database
1. In Render dashboard, click **"+ New +"** → **"PostgreSQL"**
2. Fill in:
   - **Name**: `ownly-db`
   - **Region**: Choose closest to you
   - **PostgreSQL Version**: 15
   - **Database**: `ownly`
   - **User**: `ownly_user`
3. Click **"Create Database"**
4. **Copy the connection string** (looks like `postgresql://user:pass@host:port/db`)

## Step 3: Create Web Service
1. Click **"+ New +"** → **"Web Service"**
2. Connect your GitHub repo
3. Fill in:
   - **Name**: `ownly-app`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: Free (or Starter)

## Step 4: Add Environment Variables
1. In the Web Service settings, scroll to **"Environment"**
2. Click **"Add Environment Variable"** and add:

```
DATABASE_URL=<paste_the_postgresql_url_from_step_2>
JWT_SECRET=<generate_a_random_secret_key>
NODE_ENV=production
GEMINI_API_KEY=<your_api_key_optional>
```

3. To generate a random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 5: Deploy
1. Click **"Create Web Service"**
2. Render will automatically deploy from your GitHub repo
3. Wait for deployment to complete (~5-10 minutes)
4. Your app will be live at: `https://ownly-app.onrender.com`

## Step 6: Test the Deployment
```bash
curl https://ownly-app.onrender.com/api/test
```

You should see:
```json
{
  "success": true,
  "message": "Backend is running!",
  "timestamp": "2026-09-13T..."
}
```

## Step 7: Update Frontend API Endpoint
In [src/lib/api.ts](src/lib/api.ts), update:
```typescript
const API_BASE = 'https://ownly-app.onrender.com/api';
```

## Free Tier Notes
- ⚠️ Free databases go to sleep after 7 days of inactivity
- ⚠️ Free web services spin down after 15 minutes of inactivity
- ✅ Upgrade to paid for 24/7 uptime

## Troubleshooting

### Database won't connect
- Check DATABASE_URL is correct
- Verify PostgreSQL database is running
- Check "Logs" tab in Render dashboard

### App won't start
- Check "Logs" tab for error messages
- Run `npm install && npm run build` locally to test
- Verify NODE_ENV=production is set

### Hot to view logs
- Go to Web Service → "Logs" tab
- Shows real-time server logs

## Backup & Recovery
Render automatically backs up PostgreSQL. To restore:
1. Go to Database → Backups tab
2. Click restore from backup
3. Choose restore point

## Next Steps
- [ ] Push code to GitHub
- [ ] Create Render account
- [ ] Deploy PostgreSQL database
- [ ] Deploy web service
- [ ] Test API endpoints
- [ ] Update frontend with new API URLs
- [ ] Update customers about data migration
