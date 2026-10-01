function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Responses");
  sheet.appendRow([
    new Date(),
    e.parameter.id || "",
    e.parameter.rating || "",
    e.parameter.broughtBy || "",
    e.parameter.goesWith || "",
    e.parameter.descriptors || "",
    e.parameter.notes || "",
    e.parameter.createdAt || ""
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ok: true}))
    .setMimeType(ContentService.MimeType.JSON);
}
