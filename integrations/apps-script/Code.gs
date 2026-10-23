/**
 * MASAJIDALLOH PRO — optional Google Forms -> Sheets intake automation.
 * Run as an INSTALLABLE "On form submit" trigger from the response spreadsheet.
 * This is a WAITING LIST ONLY, NOT tenant provisioning, billing, or Supabase sync.
 * Form responses remain in the restricted spreadsheet; no API/database credentials.
 */
const MDD = Object.freeze({
  STATUS_HEADER: 'Status Tindak Lanjut',
  DATE_HEADER: 'Waktu Pencatatan',
  WAITING: 'PENDING',
  ADMIN_EMAIL_PROP: 'MDD_ADMIN_NOTIFY_EMAIL'
});

function onTenantFormSubmit(event) {
  if (!event || !event.range) throw new Error('Trigger spreadsheet On form submit diperlukan.');
  const lock = LockService.getDocumentLock();
  if (!lock || !lock.tryLock(20000)) throw new Error('Gagal memperoleh lock; periksa kembali baris pendaftaran.');
  try {
    const sheet = event.range.getSheet();
    const row = event.range.getRow();
    if (row <= 1) return;
    const statusCol = findOrCreateHeader_(sheet, MDD.STATUS_HEADER);
    const dateCol = findOrCreateHeader_(sheet, MDD.DATE_HEADER);
    const statusCell = sheet.getRange(row, statusCol);
    // Do not reset manual review decisions on a duplicated trigger.
    if (statusCell.getValue()) return;
    statusCell.setValue(MDD.WAITING);
    sheet.getRange(row, dateCol).setValue(new Date());

    const adminEmail = PropertiesService.getScriptProperties()
      .getProperty(MDD.ADMIN_EMAIL_PROP);
    // Email is optional and contains no applicant PII.
    if (adminEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      MailApp.sendEmail({
        to: adminEmail,
        subject: '[MASAJIDALLOH PRO] Pendaftaran minat tenant baru',
        body: 'Ada formulir minat tenant baru pada spreadsheet terbatas.\n' +
          'Sheet: ' + sheet.getName() + '\n' +
          'Baris: ' + row + '\n' +
          'Buka Google Sheets langsung untuk memverifikasi. ' +
          'JANGAN membuat akun/menagih pembayaran otomatis.'
      });
    }
  } finally {
    lock.releaseLock();
  }
}

function findOrCreateHeader_(sheet, heading) {
  const lastCol = Math.max(1, sheet.getLastColumn());
  const headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  const found = headers.indexOf(heading);
  if (found >= 0) return found + 1;
  const next = lastCol + 1;
  sheet.getRange(1, next).setValue(heading);
  return next;
}
