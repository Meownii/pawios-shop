function authorizeDoodleMailer() {
  GmailApp.getRemainingDailyQuota();
}

function doPost(e) {
  try {
    const recipient = PropertiesService.getScriptProperties()
      .getProperty('DOODLE_RECIPIENT_EMAIL');
    const raw = e && e.postData && e.postData.contents;
    if (!recipient || !raw || raw.length > 720000) {
      return jsonResponse({ ok: false });
    }

    const payload = JSON.parse(raw);
    if (typeof payload.image !== 'string' ||
        payload.image.length > 700000 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(payload.image)) {
      return jsonResponse({ ok: false });
    }

    const nickname = String(payload.nickname || 'Anonymous')
      .replace(/[\r\n\t]/g, ' ')
      .slice(0, 24) || 'Anonymous';
    const imageBytes = Utilities.base64Decode(payload.image);
    const id = String(payload.id || 'art').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12);
    const attachment = Utilities.newBlob(imageBytes, 'image/png', 'pawio-doodle-' + id + '.png');

    GmailApp.sendEmail(
      recipient,
      'A new doodle for Pawio',
      'A new doodle was sent from the Doodle Room.\n' +
        'Name: ' + nickname + '\n\nThe PNG is attached.',
      {
        name: 'Pawio’s Doodle Room',
        attachments: [attachment]
      }
    );

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false });
  }
}

function jsonResponse(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
