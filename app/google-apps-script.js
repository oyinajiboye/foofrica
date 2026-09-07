/**
 * ============================================
 * FOOTFRICA — Google Apps Script
 * Handles: Waitlist + Spotlight
 * ============================================
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Create a new Google Sheet
 *    - Go to https://sheets.google.com and create a new spreadsheet
 *    - Name it "Footfrica" (or anything you prefer)
 *    - Rename the first tab to "Waitlist"
 *    - In Row 1, add these headers: Timestamp | Name | Email | Role
 *    - Create a second tab named "Spotlight"
 *    - In Row 1, add these headers:
 *      Name | Nickname | Position | Nationality | Era | Clubs | Achievements | Quote | Bio | ImageUrl | Goals | Caps | Trophies | UpdatedAt
 * 
 * 2. Open Apps Script
 *    - In the Google Sheet, go to Extensions → Apps Script
 *    - Delete any existing code in the editor
 *    - Paste ALL of the code below
 * 
 * 3. Deploy as Web App
 *    - Click "Deploy" → "New deployment"
 *    - Click the gear icon next to "Select type" → choose "Web app"
 *    - Set "Execute as" to "Me" (your Google account)
 *    - Set "Who has access" to "Anyone"
 *    - Click "Deploy"
 *    - Authorize the app when prompted (review permissions and allow)
 *    - Copy the Web App URL that is generated
 * 
 * 4. Update Your Code
 *    - Open src/components/Waitlist.jsx — replace YOUR_GOOGLE_SCRIPT_URL
 *    - Open src/components/Spotlight.jsx — replace YOUR_GOOGLE_SCRIPT_URL
 *    - Open src/pages/Admin.jsx — replace YOUR_GOOGLE_SCRIPT_URL
 *    - All three should use the SAME URL
 */

// ============================================
// PASTE THE CODE BELOW INTO GOOGLE APPS SCRIPT
// ============================================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Route: Update Spotlight
    if (data.action === 'updateSpotlight') {
      return updateSpotlight(data);
    }

    // Default: Waitlist submission
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Waitlist');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    }
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.email || '',
      data.role || ''
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success', message: 'Waitlist entry saved' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;

    // Route: Get Spotlight data
    if (action === 'getSpotlight') {
      return getSpotlight();
    }

    // Default: API status
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', message: 'Footfrica API is running' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// SPOTLIGHT FUNCTIONS
// ============================================

function updateSpotlight(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Spotlight');

  // Create the sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet('Spotlight');
    sheet.appendRow([
      'Name', 'Nickname', 'Position', 'Nationality', 'Era',
      'Clubs', 'Achievements', 'Quote', 'Bio', 'ImageUrl',
      'Goals', 'Caps', 'Trophies', 'UpdatedAt'
    ]);
  }

  // If there's already data (row 2+), update it. Otherwise append.
  var lastRow = sheet.getLastRow();
  var row = [
    data.name || '',
    data.nickname || '',
    data.position || '',
    data.nationality || '',
    data.era || '',
    data.clubs || '',
    data.achievements || '',
    data.quote || '',
    data.bio || '',
    data.imageUrl || '',
    data.goals || '',
    data.caps || '',
    data.trophies || '',
    new Date().toISOString()
  ];

  if (lastRow >= 2) {
    // Update existing row 2 (the current spotlight)
    var range = sheet.getRange(2, 1, 1, row.length);
    range.setValues([row]);
  } else {
    // First entry
    sheet.appendRow(row);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success', message: 'Spotlight updated' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSpotlight() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Spotlight');

  if (!sheet || sheet.getLastRow() < 2) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'empty', message: 'No spotlight data' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var values = sheet.getRange(2, 1, 1, 14).getValues()[0];

  var spotlight = {
    name: values[0] || '',
    nickname: values[1] || '',
    position: values[2] || '',
    nationality: values[3] || '',
    era: values[4] || '',
    clubs: values[5] || '',
    achievements: values[6] || '',
    quote: values[7] || '',
    bio: values[8] || '',
    imageUrl: values[9] || '',
    stats: {
      goals: values[10] || '',
      caps: values[11] || '',
      trophies: values[12] || ''
    },
    updatedAt: values[13] || ''
  };

  return ContentService
    .createTextOutput(JSON.stringify(spotlight))
    .setMimeType(ContentService.MimeType.JSON);
}
