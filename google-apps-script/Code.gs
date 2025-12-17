/**
 * The Vault - Google Apps Script Middleware
 *
 * This script acts as a middleware between the Next.js app and Google Drive/Sheets.
 * Deploy as web app: "Execute as: Me" and "Who has access: Anyone"
 *
 * CONFIGURATION: Update these constants before deploying
 */

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
const DRIVE_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID_HERE';  // Google Drive folder ID containing investor content
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';    // Google Sheet ID for config and logging

// Sheet names
const CONFIG_SHEET_NAME = 'Config';
const ACCESS_LOG_SHEET_NAME = 'Access Log';

// ============================================
// MAIN REQUEST HANDLER
// ============================================

/**
 * Handles GET requests to the web app
 * @param {Object} e - Event object containing request parameters
 * @returns {TextOutput} JSON response
 */
function doGet(e) {
  try {
    const action = e.parameter.action;

    switch (action) {
      case 'listFiles':
        return jsonResponse(listFiles());

      case 'getPassword':
        return jsonResponse(getPassword());

      case 'getAccessCount':
        const countEmail = e.parameter.email;
        if (!countEmail) {
          return jsonResponse({ error: 'Email parameter required' }, 400);
        }
        return jsonResponse(getAccessCount(countEmail));

      case 'logAccess':
        const logEmail = e.parameter.email;
        const fileName = e.parameter.fileName;
        if (!logEmail || !fileName) {
          return jsonResponse({ error: 'Email and fileName parameters required' }, 400);
        }
        return jsonResponse(logAccess(logEmail, fileName));

      case 'health':
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });

      default:
        return jsonResponse({
          error: 'Invalid action',
          validActions: ['listFiles', 'getPassword', 'getAccessCount', 'logAccess', 'health']
        }, 400);
    }
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

/**
 * Handles POST requests (for logging access)
 * @param {Object} e - Event object containing request data
 * @returns {TextOutput} JSON response
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'logAccess') {
      if (!data.email || !data.fileName) {
        return jsonResponse({ error: 'Email and fileName required' }, 400);
      }
      return jsonResponse(logAccess(data.email, data.fileName));
    }

    return jsonResponse({ error: 'Invalid action for POST' }, 400);
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Creates a JSON response
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code (not actually used by Apps Script, but for clarity)
 * @returns {TextOutput} JSON response
 */
function jsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ============================================
// DRIVE FUNCTIONS
// ============================================

/**
 * Lists all files in the configured Drive folder
 * @returns {Object} Object containing array of files or error
 */
function listFiles() {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const files = folder.getFiles();
    const fileList = [];

    // Supported MIME types
    const supportedTypes = [
      'application/vnd.google-apps.document',      // Google Docs
      'application/vnd.google-apps.spreadsheet',   // Google Sheets
      'application/vnd.google-apps.presentation',  // Google Slides
      'application/pdf',                            // PDFs
      'text/plain',                                 // Text files (for YouTube links)
      'video/mp4',                                  // Video files
    ];

    while (files.hasNext()) {
      const file = files.next();
      const mimeType = file.getMimeType();

      // Include file if it's a supported type
      if (supportedTypes.includes(mimeType) || mimeType.startsWith('video/')) {
        const fileData = {
          id: file.getId(),
          name: file.getName(),
          mimeType: mimeType,
          webViewLink: file.getUrl(),
          iconLink: getIconForMimeType(mimeType),
          createdDate: file.getDateCreated().toISOString(),
          modifiedDate: file.getLastUpdated().toISOString()
        };

        // For text files, check if they contain YouTube links
        if (mimeType === 'text/plain') {
          const content = file.getBlob().getDataAsString();
          if (content.includes('youtube.com') || content.includes('youtu.be')) {
            fileData.youtubeUrl = extractYouTubeUrl(content);
            fileData.fileType = 'youtube';
          } else {
            fileData.fileType = 'text';
          }
        } else {
          fileData.fileType = getFileType(mimeType);
        }

        fileList.push(fileData);
      }
    }

    // Sort by modified date (newest first)
    fileList.sort((a, b) => new Date(b.modifiedDate) - new Date(a.modifiedDate));

    return {
      success: true,
      files: fileList,
      count: fileList.length
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to list files: ' + error.message
    };
  }
}

/**
 * Gets a simple file type from MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} Simple file type
 */
function getFileType(mimeType) {
  const typeMap = {
    'application/vnd.google-apps.document': 'doc',
    'application/vnd.google-apps.spreadsheet': 'sheet',
    'application/vnd.google-apps.presentation': 'slides',
    'application/pdf': 'pdf',
    'text/plain': 'text',
    'video/mp4': 'video'
  };
  return typeMap[mimeType] || 'file';
}

/**
 * Gets an icon identifier for a MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} Icon identifier
 */
function getIconForMimeType(mimeType) {
  const iconMap = {
    'application/vnd.google-apps.document': 'doc',
    'application/vnd.google-apps.spreadsheet': 'sheet',
    'application/vnd.google-apps.presentation': 'slides',
    'application/pdf': 'pdf',
    'text/plain': 'text',
    'video/mp4': 'video'
  };
  return iconMap[mimeType] || 'file';
}

/**
 * Extracts YouTube URL from text content
 * @param {string} content - Text content
 * @returns {string|null} YouTube URL or null
 */
function extractYouTubeUrl(content) {
  const youtubeRegex = /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = content.match(youtubeRegex);
  if (match) {
    const videoId = match[4];
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return null;
}

// ============================================
// SHEETS FUNCTIONS
// ============================================

/**
 * Gets the password from the Config sheet
 * @returns {Object} Object containing password or error
 */
function getPassword() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const configSheet = spreadsheet.getSheetByName(CONFIG_SHEET_NAME);

    if (!configSheet) {
      return {
        success: false,
        error: `Sheet "${CONFIG_SHEET_NAME}" not found. Please create it with password in cell A1.`
      };
    }

    const password = configSheet.getRange('A1').getValue();

    if (!password) {
      return {
        success: false,
        error: 'Password not set. Please enter password in Config sheet cell A1.'
      };
    }

    return {
      success: true,
      password: String(password)
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to get password: ' + error.message
    };
  }
}

/**
 * Gets the access count for a specific email
 * @param {string} email - Email address to count
 * @returns {Object} Object containing count or error
 */
function getAccessCount(email) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let accessSheet = spreadsheet.getSheetByName(ACCESS_LOG_SHEET_NAME);

    // Create sheet if it doesn't exist
    if (!accessSheet) {
      accessSheet = spreadsheet.insertSheet(ACCESS_LOG_SHEET_NAME);
      accessSheet.getRange('A1:D1').setValues([['Email', 'Timestamp', 'File Name', 'Access Count']]);
      return { success: true, count: 0 };
    }

    const data = accessSheet.getDataRange().getValues();
    let count = 0;

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().toLowerCase() === email.toLowerCase()) {
        count++;
      }
    }

    return { success: true, count: count };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to get access count: ' + error.message
    };
  }
}

/**
 * Logs an access event to the Access Log sheet
 * @param {string} email - Email address
 * @param {string} fileName - Name of file accessed
 * @returns {Object} Object containing success status or error
 */
function logAccess(email, fileName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let accessSheet = spreadsheet.getSheetByName(ACCESS_LOG_SHEET_NAME);

    // Create sheet if it doesn't exist
    if (!accessSheet) {
      accessSheet = spreadsheet.insertSheet(ACCESS_LOG_SHEET_NAME);
      accessSheet.getRange('A1:D1').setValues([['Email', 'Timestamp', 'File Name', 'Access Count']]);
    }

    // Get current access count for this email
    const countResult = getAccessCount(email);
    const newCount = countResult.success ? countResult.count + 1 : 1;

    // Append new row
    const timestamp = new Date().toISOString();
    accessSheet.appendRow([email, timestamp, fileName, newCount]);

    return {
      success: true,
      message: 'Access logged successfully',
      accessCount: newCount,
      timestamp: timestamp
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to log access: ' + error.message
    };
  }
}

// ============================================
// SETUP HELPER
// ============================================

/**
 * Run this function once to set up the spreadsheet with required sheets
 */
function setupSpreadsheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Create Config sheet if it doesn't exist
  let configSheet = spreadsheet.getSheetByName(CONFIG_SHEET_NAME);
  if (!configSheet) {
    configSheet = spreadsheet.insertSheet(CONFIG_SHEET_NAME);
    configSheet.getRange('A1').setValue('your_password_here');
    configSheet.getRange('A1').setNote('Enter your investor portal password here');
  }

  // Create Access Log sheet if it doesn't exist
  let accessSheet = spreadsheet.getSheetByName(ACCESS_LOG_SHEET_NAME);
  if (!accessSheet) {
    accessSheet = spreadsheet.insertSheet(ACCESS_LOG_SHEET_NAME);
    accessSheet.getRange('A1:D1').setValues([['Email', 'Timestamp', 'File Name', 'Access Count']]);
    accessSheet.getRange('A1:D1').setFontWeight('bold');
  }

  Logger.log('Setup complete! Sheets created: ' + CONFIG_SHEET_NAME + ', ' + ACCESS_LOG_SHEET_NAME);
}
