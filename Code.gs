/**
 * ROETS KERSFEESONTBYT 2026 – Google Apps Script
 * Skep eers 'n Google Sheet en 'n Google Drive-lêergids.
 * Plaas die twee ID's hieronder en ontplooi as 'n webprogram.
 */
const SPREADSHEET_ID = "PLAK_JOU_GOOGLE_SHEET_ID_HIER";
const PHOTO_FOLDER_ID = "PLAK_JOU_GOOGLE_DRIVE_FOLDER_ID_HIER";
const SHEET_NAME = "RSVP-antwoorde";

function doPost(e) {
  try {
    if (SPREADSHEET_ID.startsWith("PLAK_")) throw new Error("Die Google Sheet-ID is nog nie opgestel nie.");
    const data = JSON.parse(e.postData.contents || "{}");
    if (!data.familyName || !data.attendees) throw new Error("Naam en aantal gaste is verpligtend.");
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(["Ontvang op","Naam en van","Aantal gaste","Ander gaste","Allergieë/kosvoorkeure","Familieherinnering 2026","Waarvoor terg julle mekaar?","Toekenning-nominasie","Kerswens 2027","Foto-lêers"]);
      sheet.setFrozenRows(1);
    }
    const photoLinks = [];
    const photos = Array.isArray(data.photos) ? data.photos.slice(0,3) : [];
    if (photos.length && data.photoConsent !== true) throw new Error("Foto-toestemming ontbreek.");
    if (photos.length) {
      if (PHOTO_FOLDER_ID.startsWith("PLAK_")) throw new Error("Die Drive-lêergids-ID is nog nie opgestel nie.");
      const folder = DriveApp.getFolderById(PHOTO_FOLDER_ID);
      photos.forEach(photo => {
        if (!photo.data || !photo.mimeType || !photo.mimeType.startsWith("image/")) return;
        const bytes = Utilities.base64Decode(photo.data);
        if (bytes.length > 5 * 1024 * 1024) throw new Error("Elke foto moet kleiner as 5 MB wees.");
        const safeName = String(photo.name || "Kersfeesfoto").replace(/[^\w.\- ]/g,"_").slice(0,100);
        const blob = Utilities.newBlob(bytes, photo.mimeType, new Date().getTime() + "_" + safeName);
        const file = folder.createFile(blob);
        // Geen publieke deeltoegang word toegeken nie.
        photoLinks.push(file.getName());
      });
    }
    sheet.appendRow([
      new Date(), String(data.familyName).slice(0,120), Number(data.attendees),
      String(data.guestNames || "").slice(0,500), String(data.foodNotes || "").slice(0,700),
      String(data.memory || "").slice(0,700), String(data.tease || "").slice(0,500),
      String(data.nomination || "").slice(0,500), String(data.wish || "").slice(0,500),
      photoLinks.join(" | ")
    ]);
    return jsonOutput({success:true});
  } catch (err) {
    return jsonOutput({success:false,message:err.message || "Onbekende fout"});
  }
}
function doGet() {
  return jsonOutput({success:true,message:"Roets Kersfeesontbyt RSVP-diens is beskikbaar."});
}
function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
