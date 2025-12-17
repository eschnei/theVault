# The Vault - Setup Guide

Complete setup instructions for deploying The Vault investor portal.

## Table of Contents

1. [Google Sheet Setup](#1-google-sheet-setup)
2. [Google Drive Setup](#2-google-drive-setup)
3. [Google Apps Script Setup](#3-google-apps-script-setup)
4. [Local Development](#4-local-development)
5. [Vercel Deployment](#5-vercel-deployment)
6. [Cal.com Integration](#6-calcom-integration)
7. [Troubleshooting](#troubleshooting)

---

## 1. Google Sheet Setup

Create a Google Sheet to store the password and access logs.

### Step 1: Create the Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **+ Blank** to create a new spreadsheet
3. Name it "The Vault Config" (or similar)

### Step 2: Create Config Sheet

1. Rename the first sheet tab to `Config`
2. In cell **A1**, enter your investor portal password
3. (Optional) Add a note to A1: "Investor portal password"

### Step 3: Create Access Log Sheet

1. Click the **+** button to add a new sheet
2. Rename it to `Access Log`
3. Add headers in row 1:
   - A1: `Email`
   - B1: `Timestamp`
   - C1: `File Name`
   - D1: `Access Count`
4. (Optional) Bold the header row

### Step 4: Get Spreadsheet ID

Copy the spreadsheet ID from the URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
```

Save this ID - you'll need it for the Apps Script.

---

## 2. Google Drive Setup

Create a folder to store investor materials.

### Step 1: Create the Folder

1. Go to [Google Drive](https://drive.google.com)
2. Click **+ New** → **Folder**
3. Name it "Investor Materials" (or similar)

### Step 2: Add Content

Upload or create files in the folder:
- Google Docs (pitch deck, one-pager)
- Google Sheets (financial model)
- PDFs (term sheet, deck PDF)
- Text files with YouTube links (for unlisted videos)

**Supported file types:**
- Google Docs, Sheets, Slides
- PDFs
- Text files (`.txt`) containing YouTube URLs
- Video files

### Step 3: Get Folder ID

Copy the folder ID from the URL:
```
https://drive.google.com/drive/folders/FOLDER_ID_HERE
```

Save this ID - you'll need it for the Apps Script.

---

## 3. Google Apps Script Setup

The Apps Script acts as middleware between The Vault and Google Drive/Sheets.

### Step 1: Create the Script

1. Go to [Google Apps Script](https://script.google.com)
2. Click **+ New project**
3. Name it "The Vault Middleware"

### Step 2: Add the Code

1. Delete the default `myFunction()` code
2. Copy the entire contents of `google-apps-script/Code.gs`
3. Paste into the Apps Script editor

### Step 3: Configure the Script

Update the constants at the top of the file:

```javascript
const DRIVE_FOLDER_ID = 'your_folder_id_here';     // From Step 2.3
const SPREADSHEET_ID = 'your_spreadsheet_id_here'; // From Step 1.4
```

### Step 4: Run Initial Setup

1. Select `setupSpreadsheet` from the function dropdown
2. Click **Run**
3. When prompted, click **Review permissions**
4. Choose your Google account
5. Click **Advanced** → **Go to The Vault Middleware (unsafe)**
6. Click **Allow**

This creates the required sheets if they don't exist.

### Step 5: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description:** "The Vault API v1"
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
5. Click **Deploy**
6. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/ABC.../exec`)

### Step 6: Test the Deployment

Visit your deployed URL with `?action=health`:
```
https://script.google.com/macros/s/YOUR_ID/exec?action=health
```

You should see:
```json
{"status":"ok","timestamp":"2024-..."}
```

---

## 4. Local Development

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Create Environment File

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```bash
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
NEXT_PUBLIC_CAL_COM_LINK=https://cal.com/your-username/meeting
```

### Step 3: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 4: Test the Login

1. Enter any email address
2. Enter the password from your Config sheet
3. You should see the file list

---

## 5. Vercel Deployment

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Click **Import**

### Step 3: Configure Environment Variables

In the Vercel project settings, add:

| Name | Value |
|------|-------|
| `GOOGLE_APPS_SCRIPT_URL` | Your deployed Apps Script URL |
| `NEXT_PUBLIC_CAL_COM_LINK` | Your Cal.com booking URL (optional) |

### Step 4: Deploy

Click **Deploy** and wait for the build to complete.

### Step 5: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed

---

## 6. Cal.com Integration

### Step 1: Create Cal.com Account

1. Go to [Cal.com](https://cal.com)
2. Sign up for a free account

### Step 2: Create Event Type

1. Go to **Event Types**
2. Click **+ New**
3. Configure your meeting type (duration, availability, etc.)

### Step 3: Get Booking URL

Copy your booking URL:
```
https://cal.com/your-username/meeting-type
```

### Step 4: Add to Environment

Add to your `.env.local` and Vercel environment:
```
NEXT_PUBLIC_CAL_COM_LINK=https://cal.com/your-username/meeting-type
```

---

## Troubleshooting

### "Unable to verify credentials"

**Cause:** Apps Script can't read the password from Google Sheet.

**Solutions:**
1. Verify the `SPREADSHEET_ID` in Apps Script is correct
2. Ensure the "Config" sheet exists with password in cell A1
3. Re-run the `setupSpreadsheet` function
4. Redeploy the Apps Script

### "Unable to load content"

**Cause:** Apps Script can't read files from Google Drive.

**Solutions:**
1. Verify the `DRIVE_FOLDER_ID` in Apps Script is correct
2. Ensure files exist in the folder
3. Check that files are supported types (Docs, Sheets, PDFs, text)
4. Redeploy the Apps Script

### "Too many failed attempts"

**Cause:** Rate limiting triggered after 3 failed logins.

**Solutions:**
1. Wait 15 minutes for the block to expire
2. For development, restart the Next.js server (resets in-memory state)

### Apps Script Returns Error

**Cause:** Script execution error.

**Solutions:**
1. Go to Apps Script editor
2. Click **Executions** in the left sidebar
3. Look for failed executions
4. Check the error message for details

### Files Not Showing

**Cause:** Files not in supported format or folder.

**Solutions:**
1. Ensure files are directly in the folder (not subfolders)
2. Check file types are supported:
   - Google Docs, Sheets, Slides
   - PDFs
   - Text files (`.txt`)
3. For YouTube videos, create a `.txt` file with the URL

### Environment Variable Not Working

**Cause:** Variable not loaded or named incorrectly.

**Solutions:**
1. Restart the development server after changing `.env.local`
2. For client-side variables, prefix with `NEXT_PUBLIC_`
3. In Vercel, redeploy after adding variables

### CORS Errors

**Cause:** Apps Script not configured for public access.

**Solutions:**
1. In Apps Script deployment, ensure "Who has access" is "Anyone"
2. Redeploy with new version if you changed settings

---

## Updating the Apps Script

When you modify `google-apps-script/Code.gs`:

1. Copy the new code to Apps Script editor
2. Click **Deploy** → **Manage deployments**
3. Click the pencil icon to edit
4. Change version to **New version**
5. Click **Deploy**

The URL stays the same, but new code is now active.

---

## Support

For issues or questions:
1. Check this troubleshooting guide
2. Review the Apps Script execution logs
3. Check browser console for client-side errors
