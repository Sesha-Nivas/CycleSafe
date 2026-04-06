# Troubleshooting Guide: Profile Page Not Showing User Details on Vercel

## Issues and Solutions

### Issue 1: User Profile Data Missing After Page Reload

**Problem**: When you reload the page on Vercel, the profile page shows but user details are empty.

**Cause**: localStorage data is not persisting properly between page reloads or in different browser sessions.

**Solutions**:

1. **Ensure User is Logged In**:
   - Make sure you properly log in before accessing the profile
   - After login, the user data should be saved to localStorage
   - Check if you're redirected to login page instead of profile

2. **Check Browser Console for Errors**:
   - Open DevTools (F12) on your Vercel deployment
   - Go to Console tab
   - Look for red error messages
   - Report any API errors or permission issues

3. **Verify localStorage Access**:
   - In DevTools Console, run: `localStorage.getItem('cyclesafe_current_user')`
   - If it returns `null`, login again
   - If it returns data, the user info is stored correctly

---

### Issue 2: Location Not Showing on Profile

**Problem**: The location field shows "Location unavailable" or loading indefinitely.

**Causes & Solutions**:

1. **Enable Location Permissions**:
   - Click the location icon in your browser's address bar
   - Select "Allow" to permit location access
   - Reload the page

2. **Google Maps API Key Issues**:
   - The API key might be restricted or invalid
   
   **Steps to fix**:
   a. Go to [Google Cloud Console](https://console.cloud.google.com/)
   b. Select your project (cyclesafe-ce446)
   c. Navigate to APIs & Services → Credentials
   d. Click on your API key
   e. Under "Application restrictions", ensure "HTTP referrers" includes:
      - `https://*.vercel.app/*`
      - `http://localhost/*`
   f. Under "API restrictions", ensure these are enabled:
      - Maps JavaScript API
      - Geocoding API

3. **Check Environment Variables on Vercel**:
   - Go to your Vercel project settings
   - Navigate to Settings → Environment Variables
   - Add `VITE_GOOGLE_MAPS_API_KEY` with your API key value
   - Redeploy the application

---

### Issue 3: Complete Fix Checklist for Vercel Deployment

Follow these steps to ensure everything works:

#### Step 1: Configure Environment Variables Locally
```bash
cd your-project-directory
```

Create `.env.local` file:
```
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
VITE_DEV_MODE=false
```

#### Step 2: Test Locally
```bash
npm run dev
```
- Go to http://localhost:5173
- Sign up with a test account
- Login with that account
- Navigate to Profile
- Verify all user details show
- Verify location is displayed

#### Step 3: Configure Vercel Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Click Settings → Environment Variables
4. Add these variables:
   ```
   VITE_GOOGLE_MAPS_API_KEY = [Your Google Maps API Key]
   VITE_DEV_MODE = false
   ```
5. Click "Save"

#### Step 4: Redeploy to Vercel
```bash
git add .
git commit -m "Add environment configuration for Vercel"
git push
```
Wait for Vercel to automatically redeploy.

#### Step 5: Test on Vercel
1. Open your Vercel deployment link
2. Create a new account or login
3. Go to Profile page
4. Verify:
   - User name is displayed ✓
   - Email is displayed ✓
   - Profile photo can be uploaded ✓
   - Location is showing ✓
   - Statistics (Total Rides, Km Total, etc.) are displayed ✓

---

### Issue 4: Data Still Not Persisting?

If the profile still shows no user details after following the above steps:

1. **Clear browser cache and cookies**:
   - In DevTools: Application → Clear site data
   - Or use your browser's Settings → Clear browsing data

2. **Check User Data in localStorage**:
   - DevTools Console, run:
   ```javascript
   console.log(JSON.parse(localStorage.cyclesafe_users || '[]'))
   console.log(JSON.parse(localStorage.cyclesafe_current_user || 'null'))
   ```
   - If both are empty, login again and create a test ride

3. **Verify Database Operations**:
   - In DevTools Console:
   ```javascript
   // Check if user was saved
   localStorage.getItem('cyclesafe_users')
   
   // Check if current user is set
   localStorage.getItem('cyclesafe_current_user')
   ```

---

### Issue 5: API Key Security Concerns

The API key is now in environment variables, so it won't be exposed in your code repo.

**Important**: 
- ✓ API key is in `.env.local` (git-ignored, never committed)
- ✓ API key is configured on Vercel environment variables
- ✓ API key has HTTP referrer restrictions
- Don't share your API key publicly

---

### Still Having Issues?

Check these common mistakes:

1. ❌ Forget to set `VITE_DEV_MODE=false` on Vercel
   - This logs you out on page reload
   - Fix: Add environment variable

2. ❌ Google Maps API key has wrong restrictions
   - Fix: Check restrictions include `*.vercel.app`

3. ❌ Didn't redeploy after adding environment variables
   - Fix: Go to Vercel → Deployments → Redeploy

4. ❌ Browser privacy mode disables localStorage
   - The app won't work in private/incognito mode
   - Fix: Use normal browse mode

---

### Quick Command Reference

**For local testing**:
```bash
npm run dev   # Start development server
npm run build # Build for production
```

**For browser debugging**:
```javascript
// Check all stored user data
localStorage

// Check specific user
JSON.parse(localStorage.cyclesafe_current_user)

// Clear all app data
localStorage.clear()
```

---

### Still Need Help?

Look at browser console (F12) for specific error messages and share them when seeking help.
