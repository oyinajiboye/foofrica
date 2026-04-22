/**
 * ============================================
 * FOOTFRICA — Google Apps Script for Waitlist
 * ============================================
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Create a new Google Sheet
 *    - Go to https://sheets.google.com and create a new spreadsheet
 *    - Name it "Footfrica Waitlist" (or anything you prefer)
 *    - In Row 1, add these headers: Timestamp | Name | Email | Role
 * 
 * 2. Open Apps Script
 *    - In the Google Sheet, go to Extensions → Apps Script
 *    - Delete any existing code in the editor
 *    - Paste ALL of the code below (the doPost function and helper)
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
 * 4. Update Your Landing Page
 *    - Open src/components/Waitlist.jsx
 *    - Replace 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE' with the URL you copied
 *    - Save and you're done!
 */

// ============================================
// PASTE THE CODE BELOW INTO GOOGLE APPS SCRIPT
// ============================================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.email || '',
      data.role || ''
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Data saved successfully' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Footfrica Waitlist API is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
