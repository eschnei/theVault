# Google Apps Script Setup

This folder contains the Google Apps Script that acts as middleware between the Next.js app and Google Drive/Sheets.

## Setup Instructions

### 1. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it "The Vault Config" or similar
3. Copy the spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

### 2. Create a Google Drive Folder

1. Go to [Google Drive](https://drive.google.com)
2. Create a new folder for investor content
3. Copy the folder ID from the URL: `https://drive.google.com/drive/folders/FOLDER_ID`

### 3. Create the Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Name it "The Vault Middleware"
4. Delete the default code and paste the contents of `Code.gs`
5. Update the configuration constants at the top:
   ```javascript
   const DRIVE_FOLDER_ID = 'your_folder_id_here';
   const SPREADSHEET_ID = 'your_spreadsheet_id_here';
   ```

### 4. Run Initial Setup

1. In the Apps Script editor, select the `setupSpreadsheet` function from the dropdown
2. Click "Run"
3. Grant permissions when prompted (this allows the script to access your Drive and Sheets)
4. This creates the "Config" and "Access Log" sheets

### 5. Set Your Password

1. Open your Google Sheet
2. Go to the "Config" sheet
3. Enter your investor portal password in cell A1

### 6. Deploy as Web App

1. In the Apps Script editor, click "Deploy" > "New deployment"
2. Click the gear icon next to "Select type" and choose "Web app"
3. Configure:
   - Description: "The Vault API v1"
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click "Deploy"
5. Copy the Web app URL (looks like `https://script.google.com/macros/s/ABC123.../exec`)

### 7. Configure Next.js

Add the web app URL to your `.env.local`:

```
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

## Testing

Visit your deployed URL with `?action=health` to verify it's working:

```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=health
```

You should see:
```json
{"status":"ok","timestamp":"2024-..."}
```

## API Endpoints

| Action | Method | Parameters | Description |
|--------|--------|------------|-------------|
| `health` | GET | - | Health check |
| `listFiles` | GET | - | List all files in Drive folder |
| `getPassword` | GET | - | Get password from Config sheet |
| `getAccessCount` | GET | `email` | Get access count for email |
| `logAccess` | GET/POST | `email`, `fileName` | Log file access |

## Updating the Script

When you make changes to `Code.gs`:

1. Update the code in the Apps Script editor
2. Click "Deploy" > "Manage deployments"
3. Click the pencil icon to edit
4. Change version to "New version"
5. Click "Deploy"

The URL stays the same, but the new code is now active.
